export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface PageTitleData {
  title: string;
  subtitle?: string;
}

export interface SlotState {
  breadcrumbs: BreadcrumbItem[];
  pageTitle: PageTitleData | null;
}
