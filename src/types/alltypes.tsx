export interface TypeMovie {
  id: number;
  name: string;
  posterUrl: string;
  category: string;
  releaseDate: string;
  duration: number;
}

export interface TypeCinema{
  id:number
  name: string
  address: string
  status: string
}

export interface UserType{
  id:number
  email:string
  name:string
  phone: string
  roleName:string
  birthday: string
  status: string
}

export interface Movie {
  id: number;
  name: string;
  posterUrl: string;
  yearRelease: number;
  category: string;
  showSchedule: string;
  status: string;
  creatAt: string;
}