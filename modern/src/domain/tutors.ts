export type HistoricalTutor = Readonly<{
  name: string;
  surname: string;
  historicalAsset: string;
}>;

export const HISTORICAL_TUTORS: readonly HistoricalTutor[] = [
  {
    name: "María Elena",
    surname: "Martinez",
    historicalAsset: "assets/imagenesTutores/tutorMaria.jpeg",
  },
  {
    name: "Enzo Daniel",
    surname: "Pinotti",
    historicalAsset: "assets/imagenesTutores/tutorEnzo.jpg",
  },
  {
    name: "Martin",
    surname: "Moreno",
    historicalAsset: "assets/imagenesTutores/tutorMartin.jpeg",
  },
  {
    name: "Fernanda Lorena",
    surname: "Ortiz",
    historicalAsset: "assets/imagenesTutores/tutorFernanda.jpeg",
  },
] as const;

export function tutorInitials(tutor: HistoricalTutor): string {
  const firstInitial = tutor.name.trim().charAt(0);
  const surnameInitial = tutor.surname.trim().charAt(0);
  return `${firstInitial}${surnameInitial}`.toLocaleUpperCase("es");
}
