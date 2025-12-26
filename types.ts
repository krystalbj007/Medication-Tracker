
export interface MedicationLog {
  id: string;
  timestamp: number;
  medicineName: string;
  medicineType: string;
}

export interface MedicationSettings {
  name: string;
  type: string;
  intervalHours: number;
  lastDoseTime: number | null;
}

export interface AIAdvice {
  message: string;
  type: 'encouragement' | 'info' | 'warning';
}
