import LogClient from "./LogClient";

interface Props {
  searchParams: Promise<{ date?: string }>;
}

export default async function LogPage({ searchParams }: Props) {
  const { date } = await searchParams;
  return <LogClient date={date} />;
}
