import {
  collection,
  doc,
  runTransaction,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

export async function logWaste({ userId, userName, clusterId, itemType, quantity, weight }) {
  const clusterRef = doc(db, "clusters", clusterId);
  const logRef = doc(collection(db, "waste_logs"));
  
  const result = await runTransaction(db, async (transaction) => {
    const clusterSnap = await transaction.get(clusterRef);
    if (!clusterSnap.exists()) throw "Cluster does not exist!";

    const clusterData = clusterSnap.data();
    const addedGrams = weight * quantity * 1000;
    const newTotalWeight = (clusterData.totalWeight || 0) + addedGrams;
    const threshold = clusterData.threshold || 10000;
    
    // 1. Update Cluster (Weight + Status)
    let newStatus = clusterData.status || "collecting";
    let newMarketplaceStatus = clusterData.marketplaceStatus || "collecting";
    let hitThreshold = false;
    
    if (newTotalWeight >= threshold && newStatus === "collecting") {
      newStatus = "scheduled";
      newMarketplaceStatus = "available";
      hitThreshold = true;

      // 2. Create pickup job entry in pickup_jobs collection
      const jobRef = doc(collection(db, "pickup_jobs"));
      transaction.set(jobRef, {
        clusterId,
        clusterName: clusterData.name,
        totalWeight: newTotalWeight,
        status: "available",
        createdAt: serverTimestamp(),
        latitude: clusterData.latitude,
        longitude: clusterData.longitude
      });
    }

    transaction.update(clusterRef, {
      totalWeight: newTotalWeight,
      status: newStatus,
      marketplaceStatus: newMarketplaceStatus
    });

    // 3. Add the detailed log entry
    transaction.set(logRef, {
      userId,
      userName,
      clusterId,
      itemType,
      quantity,
      weight, // per unit in kg
      totalWeight: weight * quantity,
      timestamp: serverTimestamp(),
      archived: false,
    });
    
    return { logId: logRef.id, hitThreshold };
  });

  return result;
}

export async function completePickup(clusterId) {
  const clusterRef = doc(db, "clusters", clusterId);
  const composition = await getClusterComposition(clusterId);
  
  const summary = await runTransaction(db, async (transaction) => {
    // 1. READS
    const clusterSnap = await transaction.get(clusterRef);
    if (!clusterSnap.exists()) throw "Cluster missing";
    
    const data = clusterSnap.data();
    const finalWeight = data.totalWeight || 0;

    const jobsQuery = query(
      collection(db, "pickup_jobs"),
      where("clusterId", "==", clusterId)
    );
    const jobsSnap = await getDocs(jobsQuery);

    // 2. WRITES
    // Update Cluster
    transaction.update(clusterRef, {
      totalWeight: 0,
      status: "collecting",
      marketplaceStatus: "collecting",
      lastPickup: {
        weight: finalWeight,
        timestamp: serverTimestamp(),
        recyclerId: data.assignedRecyclerId || "unknown"
      },
      assignedRecyclerId: null,
      assignedRecyclerName: null,
      pickupETA: null,
      arrivalDate: null,
      arrivalTime: null,
      pickupLocation: null,
      pickupCoordinates: null
    });

    // Move pickup job to history collection and delete from jobs
    jobsSnap.forEach(jobDoc => {
      const jobData = jobDoc.data();
      if (jobData.status !== "completed") {
        const historyRef = doc(collection(db, "pickup_history"));
        transaction.set(historyRef, {
          recyclerId: jobData.recyclerId || data.assignedRecyclerId,
          recyclerName: jobData.recyclerName || data.assignedRecyclerName,
          clusterId: clusterId,
          clusterName: jobData.clusterName || data.name || "Unknown Cluster",
          finalWeight: finalWeight,
          composition: Object.keys(composition).length > 0 ? composition : { "Mixed E-Waste": { weight: finalWeight, count: 1 } },
          completedAt: serverTimestamp(),
          pickupLocation: data.pickupLocation || null,
          arrivalDate: data.arrivalDate || null
        });
        transaction.delete(jobDoc.ref);
      }
    });

    return { finalWeight, clusterId };
  });

  // Archive old logs
  const q = query(collection(db, "waste_logs"), where("clusterId", "==", clusterId), where("archived", "==", false));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  
  snap.docs.forEach(d => {
    batch.update(d.ref, { archived: true, pickupId: clusterId + "_" + Date.now() });
  });
  
  await batch.commit();
  return summary;
}

export async function getClusterComposition(clusterId) {
  const q = query(
    collection(db, "waste_logs"),
    where("clusterId", "==", clusterId),
    where("archived", "==", false)
  );
  const snapshot = await getDocs(q);
  const composition = {};
  let total = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const type = data.itemType || "Other";
    const weight = (data.weight || 0) * (data.quantity || 1);
    composition[type] = (composition[type] || 0) + weight;
    total += weight;
  });

  return { composition, total };
}

export async function getUserLogs(userId) {
  const q = query(
    collection(db, "waste_logs"),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getClusterLogs(clusterId) {
  const q = query(
    collection(db, "waste_logs"),
    where("clusterId", "==", clusterId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
