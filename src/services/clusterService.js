import { collection, getDocs, doc, setDoc, runTransaction, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { assignUserCluster } from "./authService";

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function geocodeCity(city) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        city
      )}`
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        bbox: data[0].boundingbox // [lat_min, lat_max, lon_min, lon_max]
      };
    }
  } catch (error) {
    console.error("Geocoding failed:", error);
  }
  return null;
}

export async function assignNearestCluster(uid, lat, lon) {
  const clustersRef = collection(db, "clusters");
  const snapshot = await getDocs(clustersRef);

  let nearestCluster = null;
  let minDistance = Infinity;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.latitude && data.longitude) {
      const dist = haversineDistance(lat, lon, data.latitude, data.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearestCluster = { ...data, id: docSnap.id }; // Assuming id is the document ID
      }
    }
  });

  // Assign if within 2 km radius
  if (nearestCluster && minDistance <= 2.0) {
    await assignUserCluster(uid, nearestCluster.id);
    return { cluster: nearestCluster, distance: minDistance };
  } else {
    // Otherwise, create a new cluster
    const newClusterRef = doc(collection(db, "clusters"));
    const newClusterData = {
      id: newClusterRef.id,
      name: `Node-${newClusterRef.id.substring(0, 4).toUpperCase()}`,
      latitude: lat,
      longitude: lon,
      totalWeight: 0,
      threshold: 10000,
      status: "collecting",
    };

    await setDoc(newClusterRef, newClusterData);
    await assignUserCluster(uid, newClusterRef.id);
    
    return { cluster: newClusterData, distance: 0, isNew: true };
  }
}

export async function createNewCluster(uid, lat, lon) {
  const newClusterRef = doc(collection(db, "clusters"));
  const newClusterData = {
    id: newClusterRef.id,
    name: `Node-${newClusterRef.id.substring(0, 4).toUpperCase()}`,
    latitude: lat,
    longitude: lon,
    totalWeight: 0,
    threshold: 10000,
    status: "collecting",
  };

  await setDoc(newClusterRef, newClusterData);
  await assignUserCluster(uid, newClusterRef.id);
  
  return { cluster: newClusterData, distance: 0, isNew: true };
}

export async function fetchClusters() {
  const clustersRef = collection(db, "clusters");
  const snapshot = await getDocs(clustersRef);
  const clusters = [];
  snapshot.forEach((docSnap) => {
    clusters.push({ ...docSnap.data(), id: docSnap.id });
  });
  return clusters;
}

export async function claimCluster(clusterId, recyclerId, recyclerName) {
  const clusterRef = doc(db, "clusters", clusterId);
  const jobsQuery = query(
    collection(db, "pickup_jobs"),
    where("clusterId", "==", clusterId)
  );

  await runTransaction(db, async (transaction) => {
    // 1. READS
    const clusterSnap = await transaction.get(clusterRef);
    if (!clusterSnap.exists()) throw "Cluster missing";
    
    const clusterData = clusterSnap.data();
    if (clusterData.marketplaceStatus !== "available") throw "Job already claimed!";

    const jobsSnap = await getDocs(jobsQuery);

    // 2. WRITES
    // Update Cluster
    transaction.update(clusterRef, {
      marketplaceStatus: "claimed",
      assignedRecyclerId: recyclerId,
      assignedRecyclerName: recyclerName,
      claimedAt: serverTimestamp()
    });

    // Update Pickup Job
    jobsSnap.forEach(jobDoc => {
      if (jobDoc.data().status === "available") {
        transaction.update(jobDoc.ref, {
          status: "claimed",
          recyclerId,
          recyclerName,
          claimedAt: serverTimestamp()
        });
      }
    });
  });
}

export async function updatePickupStatus(clusterId, status, scheduleData = null) {
  const clusterRef = doc(db, "clusters", clusterId);
  const jobsQuery = query(
    collection(db, "pickup_jobs"),
    where("clusterId", "==", clusterId)
  );

  await runTransaction(db, async (transaction) => {
    // 1. READS
    const jobsSnap = await getDocs(jobsQuery);

    // 2. WRITES
    let updateData = { marketplaceStatus: status };
    if (scheduleData && status === "arriving") {
      updateData = {
        ...updateData,
        arrivalDate: scheduleData.date,
        arrivalTime: scheduleData.time,
        pickupLocation: scheduleData.location,
        contactName: scheduleData.contactName,
        contactNumber: scheduleData.contactNumber
      };
    }

    transaction.update(clusterRef, updateData);

    jobsSnap.forEach(jobDoc => {
      if (jobDoc.data().status !== "completed") {
        let jobUpdate = { status };
        if (scheduleData && status === "arriving") {
           jobUpdate = { 
             ...jobUpdate, 
             arrivalDate: scheduleData.date, 
             arrivalTime: scheduleData.time, 
             pickupLocation: scheduleData.location,
             contactName: scheduleData.contactName,
             contactNumber: scheduleData.contactNumber
           };
        }
        transaction.update(jobDoc.ref, jobUpdate);
      }
    });
  });
}



export async function getNearbyClusters(userLat, userLon, radiusKm = 2) {
  const allClusters = await fetchClusters();
  return allClusters
    .map((cluster) => {
      const distance = haversineDistance(
        userLat,
        userLon,
        cluster.latitude,
        cluster.longitude
      );
      return { ...cluster, distance };
    })
    .filter((cluster) => cluster.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

export async function getClustersInArea(bbox, centerLat, centerLon) {
  const allClusters = await fetchClusters();
  const [latMin, latMax, lonMin, lonMax] = bbox.map(parseFloat);
  
  return allClusters
    .filter((c) => {
      return (
        c.latitude >= latMin &&
        c.latitude <= latMax &&
        c.longitude >= lonMin &&
        c.longitude <= lonMax
      );
    })
    .map((cluster) => {
      const distance = haversineDistance(centerLat, centerLon, cluster.latitude, cluster.longitude);
      return { ...cluster, distance };
    })
    .sort((a, b) => a.distance - b.distance);
}

export async function getReverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
    );
    const data = await res.json();
    if (data && data.address) {
      const road = data.address.road || data.address.pedestrian || data.address.path || "";
      const suburb = data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.city_district || "";
      const city = data.address.city || data.address.town || data.address.village || data.address.state_district || data.address.county || "";
      const state = data.address.state || "";
      
      let parts = [];
      if (road) parts.push(road);
      if (suburb) parts.push(suburb);
      if (city) parts.push(city);
      if (parts.length < 2 && state) parts.push(state);
      
      if (parts.length > 0) {
        // Return max 3 segments for readability
        return parts.slice(0, 3).join(", ");
      }
      
      return data.display_name.split(",").slice(0, 3).join(", ") || "Unknown Location";
    }
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
  }
  return "Unknown Location";
}
