import Card from '../components/Card'
import Button from '../components/Button'
import HorizontalBarChart from '../components/HorizontalBarChart'
import ColumnChart from '../components/ColumnChart'

const casesByType = [
  { label: 'GBV', value: 48 },
  { label: 'Child protection', value: 36 },
  { label: 'Labor', value: 28 },
  { label: 'Health referral', value: 22 },
]

const skillDemand = [
  { label: 'Tailoring', value: 68 },
  { label: 'Agri-tech', value: 54 },
  { label: 'Hospitality', value: 42 },
  { label: 'Carpentry', value: 37 },
  { label: 'Digital', value: 31 },
]

export default function Dashboard() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Monitoring and Evaluation</p>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">
            Consolidated performance view across members, cases, and skills programs.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="outline">Download brief</Button>
          <Button>Generate report</Button>
        </div>
      </div>

      <section className="grid-metrics">
        <Card className="metric-card reveal" title="Total members" subtitle="Active registry">
          <div className="metric-value">4,812</div>
          <p className="metric-meta">+8% since last quarter</p>
        </Card>
        <Card className="metric-card reveal" title="Employed vs unemployed" subtitle="Program placement">
          <div className="split-meter">
            <div className="split-meter-bar">
              <span style={{ width: '64%' }} />
            </div>
            <div className="split-meter-labels">
              <span>Employed 64%</span>
              <span>Unemployed 36%</span>
            </div>
          </div>
          <p className="metric-meta">Job placements remain stable</p>
        </Card>
        <Card className="metric-card reveal" title="Top skills demanded" subtitle="Current intake">
          <ul className="metric-list">
            <li>Tailoring</li>
            <li>Agri-tech</li>
            <li>Hospitality</li>
          </ul>
          <p className="metric-meta">Requests trending in northern districts</p>
        </Card>
        <Card className="metric-card reveal" title="Active cases" subtitle="Open investigations">
          <div className="metric-value">126</div>
          <p className="metric-meta">12 marked critical</p>
        </Card>
        <Card className="metric-card reveal" title="Trainings completed" subtitle="Last 30 days">
          <div className="metric-value">318</div>
          <p className="metric-meta">Completion rate 91%</p>
        </Card>
      </section>

      <section className="grid-charts">
        <Card
          title="Cases by type"
          subtitle="Open cases by category"
          action={<Button variant="ghost">View cases</Button>}
          className="reveal"
        >
          <HorizontalBarChart data={casesByType} />
        </Card>
        <Card
          title="Skill demand"
          subtitle="Requests by skill area"
          action={<Button variant="ghost">Skill details</Button>}
          className="reveal"
        >
          <ColumnChart data={skillDemand} />
        </Card>
      </section>
    </div>
  )
}
