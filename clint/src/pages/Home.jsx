import { Link } from 'react-router-dom';
import Card from '../components/Card';

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1>Welcome to the Election Commission Portal</h1>
        <p>
          Your trusted platform for transparent and secure elections. Register as a voter or leader, 
          participate in elections, and view real-time results.
        </p>
        <div className="cta-buttons">
          <Link to="/register" className="btn btn-primary">
            Register Now
          </Link>
          <Link to="/elections" className="btn btn-secondary">
            View Elections
          </Link>
        </div>
      </section>

      <section className="features">
        <h2>Key Features</h2>
        <div className="feature-cards">
          <Card title="Secure Voting">
            <p>
              Our platform ensures secure and tamper-proof voting with advanced
              authentication mechanisms.
            </p>
          </Card>
          <Card title="Real-time Results">
            <p>
              View election results in real-time as they are counted and
              verified.
            </p>
          </Card>
          <Card title="Leader Profiles">
            <p>
              Explore detailed profiles of leaders, their parties, and
              manifestos.
            </p>
          </Card>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Register</h3>
            <p>Create an account as a voter or leader with your details.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Verify</h3>
            <p>Verify your identity with your voter ID or credentials.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Vote</h3>
            <p>Cast your vote securely during active election periods.</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Results</h3>
            <p>View the election results once counting is complete.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home; 