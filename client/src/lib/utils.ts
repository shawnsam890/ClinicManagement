import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generatePatientId(prefix: string = "PT", digits: number = 4): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * Math.pow(10, digits));
  const paddedNum = randomNum.toString().padStart(digits, "0");
  return `${prefix}${year}-${paddedNum}`;
}

export function getInitials(name: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function getCurrentMonthYear(): { month: string; year: number } {
  const date = new Date();
  return {
    month: monthNames[date.getMonth()],
    year: date.getFullYear(),
  };
}

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function calculateNetSalary(
  baseSalary: number,
  bonus: number = 0,
  deduction: number = 0
): number {
  return baseSalary + bonus - deduction;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function calculateAttendancePercentage(
  presentDays: number,
  totalDays: number
): number {
  if (totalDays === 0) return 0;
  return Math.round((presentDays / totalDays) * 100);
}
