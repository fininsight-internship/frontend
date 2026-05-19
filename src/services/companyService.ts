import axios from "axios";

export const getCompanyReport = (company: string, job?: string) => {
  return axios.get("http://localhost:8000/company/report", {
    params: { company, job },
  });
};