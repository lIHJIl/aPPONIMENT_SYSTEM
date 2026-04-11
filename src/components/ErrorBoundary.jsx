import React, { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'hsl(var(--surface))', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ color: 'hsl(var(--danger))', marginBottom: '1rem' }}>Something went wrong.</h2>
          <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '2rem' }}>Please refresh the page. If the problem persists, contact support.</p>
          <div>
            <button className="btn btn-primary" onClick={() => this.setState({ hasError: false, error: null })}>
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
