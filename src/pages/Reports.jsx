import Card from '../components/Card'
import Button from '../components/Button'
import HorizontalBarChart from '../components/HorizontalBarChart'

const outcomes = [
  { label: 'Resolved', value: 86 },
  { label: 'Ongoing', value: 42 },
  { label: 'Escalated', value: 18 },
]

export default function Reports() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Reports and M&E</p>
          <h1 className="page-title">Reporting Hub</h1>
          <p className="page-subtitle">Analyze outcomes, export summaries, and monitor trends.</p>
        </div>
        <div className="page-actions">
          <Button variant="outline">Share dashboard</Button>
          <Button>Schedule report</Button>
        </div>
      </div>

      <div className="reports-layout">
        <aside className="filters-panel">
          <h3>Filters</h3>
          <label className="form-field">
            <span>Date range</span>
            <input type="date" />
            <input type="date" />
          </label>
          <label className="form-field">
            <span>District</span>
            <select>
              <option>All districts</option>
              <option>North</option>
              <option>Central</option>
              <option>South</option>
            </select>
          </label>
          <label className="form-field">
            <span>Program</span>
            <select>
              <option>All programs</option>
              <option>Skills uplift</option>
              <option>Livelihoods</option>
            </select>
          </label>
          <label className="form-field">
            <span>Case type</span>
            <select>
              <option>All types</option>
              <option>GBV</option>
              <option>Child protection</option>
              <option>Labor</option>
            </select>
          </label>
          <div className="filter-actions">
            <Button>Apply filters</Button>
            <Button variant="ghost">Reset</Button>
          </div>
        </aside>

        <div className="reports-main">
          <Card title="Outcome summary" subtitle="Cases and referrals" className="reveal">
            <HorizontalBarChart data={outcomes} />
          </Card>

          <Card title="Summary table" subtitle="Key indicators" className="reveal">
            <div className="summary-table">
              <div>
                <p>Total cases</p>
                <strong>146</strong>
              </div>
              <div>
                <p>Average response time</p>
                <strong>3.2 days</strong>
              </div>
              <div>
                <p>Training completion</p>
                <strong>91%</strong>
              </div>
              <div>
                <p>Placement success</p>
                <strong>64%</strong>
              </div>
            </div>
          </Card>

          <Card title="Exports" subtitle="Download data" className="reveal">
            <div className="export-actions">
              <Button>Export PDF</Button>
              <Button variant="outline">Export Excel</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
