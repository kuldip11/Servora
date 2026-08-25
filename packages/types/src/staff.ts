export interface StaffShift {
  id: string;
  userId: string;
  branchId: string;
  startTime: string;
  endTime: string | null;
  notes: string | null;
}

export interface AttendanceLog {
  id: string;
  userId: string;
  branchId: string;
  checkIn: string;
  checkOut: string | null;
}