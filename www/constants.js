/**
 * Storage keys and default document templates for Wireloom Studio.
 */

export const STORAGE_KEYS = {
  DOC: 'wireloom:doc',
  THEME: 'wireloom:theme',
  SPLIT: 'wireloom:split',
};

export const DEFAULT_DOC = `define @MetricCard:
  panel:
    row:
      icon name="$icon" accent=$accent
      spacer
      text "$trend" accent=$accent
    text "$title" muted
    text "$value" bold size=large

window "Cloud Platform & Cluster Observability":
  header:
    row:
      text "Production Cluster: eu-central-1" bold size=large
      spacer
      chip "Cmd+K" variant=kbd
      divider orientation=vertical
      button "Deploy Service" primary

  row:
    use @MetricCard title="Total QPS" value="142.8k" trend="+14% /hr" icon="star" accent=success
    use @MetricCard title="Avg Latency" value="18.4ms" trend="-2.1ms" icon="gear" accent=research
    use @MetricCard title="Error Rate" value="0.04%" trend="Optimal" icon="check" accent=approval
    use @MetricCard title="Memory" value="84.2%" trend="Warning" icon="warning" accent=warning

  tabs:
    tab "Active Services" active:
      table striped compact:
        columns:
          column "Service Name" w=160 align=left
          column "Health Status" w=120 align=center
          column "P99 Latency" w=100 align=right
          column "Throughput" w=100 align=right
          column "Runtime" w=90 align=center
        tr:
          td "auth-service"
          status "Healthy" kind=success
          td "12ms"
          td "48.2k"
          chip "Go" variant=kbd
        tr:
          td "billing-api"
          status "Healthy" kind=success
          td "24ms"
          td "12.1k"
          chip "Rust" variant=kbd
        tr:
          td "search-indexer"
          status "Degraded" kind=warning
          td "184ms"
          td "32.0k"
          chip "Java" variant=kbd
        foot:
          td "3 Services Running (99.98% SLA)" span=3 align=left
          td "142.8k req/s" span=2 align=right

    tab "Config & Manifest":
      code lang="yaml" lines:
        text "apiVersion: apps/v1"
        text "kind: Deployment"
        text "metadata:"
        text "  name: cluster-ingress-v2"
        text "spec:"
        text "  replicas: 8"

  footer:
    row:
      status "Cluster Healthy" kind=success
      divider orientation=vertical
      text "Nodes: 16/16 Active" muted
      spacer
      button "Refresh Metrics"
      button "Export Report"`;
