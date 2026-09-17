export interface LocalityCity {
  id: number;
  name: string;
}

export interface LocalityDepartment {
  id: number;
  name: string;
  cities: LocalityCity[];
}
