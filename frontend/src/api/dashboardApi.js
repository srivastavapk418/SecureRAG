import http from "./http";

export function getEmployeeOverview() {
  return http.get("/dashboard/employee/overview").then((response) => response.data);
}

export function getAdminOverview() {
  return http.get("/dashboard/admin/overview").then((response) => response.data);
}

