export interface Classroom {
  id: number;
  roomCode: string;
  roomName: string;
  buildingId: number;
  buildingCode: string;
  buildingName: string;
  floorNumber: number | null;
  capacity: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ClassroomPayload = {
  roomCode?: string;
  roomName: string;
  buildingId: number;
  floorNumber?: number | null;
  capacity?: number | null;
  description?: string | null;
};
