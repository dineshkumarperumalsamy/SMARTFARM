export type FarmNode = {
  id: string;
  name: string;
  cropType: string;
  status: "Online" | "Warning" | "Offline";
  battery: number;
  signal: number;
  temperature: string;
  moisture: string;
  productivity: string;
};

export const farmNodes: FarmNode[] = [
  {
    id: "node-a12",
    name: "North Field A12",
    cropType: "Tomatoes",
    status: "Online",
    battery: 86,
    signal: 92,
    temperature: "24.1°C",
    moisture: "63%",
    productivity: "+5.1%"
  },
  {
    id: "node-b07",
    name: "Hydro Bay B07",
    cropType: "Lettuce",
    status: "Warning",
    battery: 42,
    signal: 68,
    temperature: "26.8°C",
    moisture: "79%",
    productivity: "-1.4%"
  },
  {
    id: "node-c33",
    name: "East Greenhouse C33",
    cropType: "Bell Peppers",
    status: "Online",
    battery: 77,
    signal: 88,
    temperature: "23.5°C",
    moisture: "58%",
    productivity: "+2.9%"
  },
  {
    id: "node-d04",
    name: "Storage Edge D04",
    cropType: "Herbs",
    status: "Offline",
    battery: 11,
    signal: 18,
    temperature: "19.9°C",
    moisture: "49%",
    productivity: "N/A"
  }
];

export function getFarmNode(nodeId: string) {
  return farmNodes.find((node) => node.id === nodeId);
}
