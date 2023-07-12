const mapping: Record<string, string> = {
  applications: 'application',
  companies: 'company',
  jobs: 'job',
  users: 'user',
};

export function convertRouteToEntityUtil(route: string) {
  return mapping[route] || route;
}
