// lib/utils/venezuelaHolidays.ts
// Helper para identificar días feriados de Venezuela (San Cristóbal, Táchira)

import { isWeekend, parseISO } from 'date-fns';

// Feriados nacionales de Venezuela (fechas fijas)
const FIXED_HOLIDAYS = [
  { month: 1, day: 1 },   // Año Nuevo
  { month: 2, day: 12 },  // Carnaval (varía, pero aproximado)
  { month: 2, day: 13 },  // Carnaval
  { month: 3, day: 19 },  // San José (Día del Padre)
  { month: 4, day: 19 },  // Declaración de Independencia
  { month: 5, day: 1 },   // Día del Trabajador
  { month: 6, day: 24 },  // Batalla de Carabobo
  { month: 7, day: 5 },   // Día de la Independencia
  { month: 7, day: 24 },  // Natalicio de Simón Bolívar
  { month: 10, day: 12 }, // Día de la Resistencia Indígena
  { month: 12, day: 24 }, // Nochebuena
  { month: 12, day: 25 }, // Navidad
  { month: 12, day: 31 }, // Fin de Año
];

// Feriados específicos de Táchira
const TACHIRA_HOLIDAYS = [
  { month: 6, day: 15 },  // Santo Patrón de San Cristóbal
];

/**
 * Determina si una fecha es día hábil en San Cristóbal, Táchira
 * Día hábil = Lunes-Viernes, excluyendo feriados
 */
export function isBusinessDay(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  // 1. Verificar si es fin de semana (Sábado o Domingo)
  if (isWeekend(dateObj)) {
    return false;
  }
  
  // 2. Verificar feriados nacionales
  const month = dateObj.getMonth() + 1; // getMonth() es 0-indexed
  const day = dateObj.getDate();
  
  const isNationalHoliday = FIXED_HOLIDAYS.some(
    holiday => holiday.month === month && holiday.day === day
  );
  
  if (isNationalHoliday) {
    return false;
  }
  
  // 3. Verificar feriados de Táchira
  const isTachiraHoliday = TACHIRA_HOLIDAYS.some(
    holiday => holiday.month === month && holiday.day === day
  );
  
  if (isTachiraHoliday) {
    return false;
  }
  
  // Si no es fin de semana ni feriado, es día hábil
  return true;
}

/**
 * Obtiene el primer día hábil del mes
 */
export function getFirstBusinessDayOfMonth(year: number, month: number): Date {
  let date = new Date(year, month - 1, 1); // month es 1-indexed aquí
  
  while (!isBusinessDay(date)) {
    date.setDate(date.getDate() + 1);
  }
  
  return date;
}

/**
 * Obtiene todos los días hábiles de un rango
 */
export function getBusinessDaysInRange(startDate: Date | string, endDate: Date | string): Date[] {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  const businessDays: Date[] = [];
  const current = new Date(start);
  
  while (current <= end) {
    if (isBusinessDay(current)) {
      businessDays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return businessDays;
}

/**
 * Lista completa de feriados para referencia
 */
export function getHolidaysForYear(year: number): Array<{ date: Date; name: string }> {
  return [
    { date: new Date(year, 0, 1), name: 'Año Nuevo' },
    { date: new Date(year, 1, 12), name: 'Carnaval' },
    { date: new Date(year, 1, 13), name: 'Carnaval' },
    { date: new Date(year, 3, 19), name: 'Declaración de Independencia' },
    { date: new Date(year, 4, 1), name: 'Día del Trabajador' },
    { date: new Date(year, 5, 15), name: 'Santo Patrón San Cristóbal' },
    { date: new Date(year, 5, 24), name: 'Batalla de Carabobo' },
    { date: new Date(year, 6, 5), name: 'Día de la Independencia' },
    { date: new Date(year, 6, 24), name: 'Natalicio de Simón Bolívar' },
    { date: new Date(year, 9, 12), name: 'Día de la Resistencia Indígena' },
    { date: new Date(year, 11, 24), name: 'Nochebuena' },
    { date: new Date(year, 11, 25), name: 'Navidad' },
    { date: new Date(year, 11, 31), name: 'Fin de Año' },
  ];
}
