export type ChapterStatus = "EMPTY" | "DRAFTING" | "DRAFTED" | "EDITED";
export type Plan = "FREE" | "PRO" | "CAMPUS";

export interface ChapterModel {
  id: string;
  number: number;
  title: string;
  content: string;
  status: ChapterStatus;
  projectId: string;
}

export interface ReferenceModel {
  id: string;
  authors: string;
  year: string;
  title: string;
  source: string;
  formatted: string;
  projectId: string;
}

export interface ThesisProjectModel {
  id: string;
  title: string;
  topic: string;
  major: string;
  citationFmt: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  chapters: ChapterModel[];
  references?: ReferenceModel[];
}
