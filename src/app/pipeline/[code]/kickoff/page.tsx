import { KickoffBriefPage } from "@/components/kickoff-brief";

export default function KickoffRoute({ params }: { params: { code: string } }) {
  return <KickoffBriefPage code={params.code} />;
}
