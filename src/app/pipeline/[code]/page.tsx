import { PipelinePage } from "@/components/pipeline-page";

export default function PipelineRoute({ params }: { params: { code: string } }) {
  return <PipelinePage code={params.code} />;
}
