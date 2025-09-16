This API returns membership program composition breakdown per month.

GET /api/membership-program-breakdown?file=membersbeta.csv

Response shape:
{
  "allData": Array<{ month: string, programs: Record<string, number>, total: number }>,
  "losGatosData": Array<...>,
  "pleasantonData": Array<...>
}
