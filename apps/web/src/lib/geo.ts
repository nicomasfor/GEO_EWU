import type { Vector3Tuple } from "three";

export function latLngToVector3(lat: number, lng: number, radius = 2.05): Vector3Tuple {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  return [
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}
