import React from 'react';
import Layout from './Layout';
import { currency } from './util/format';

export default class Scoreboard extends React.Component {

  constructor() {
    super();
    this.state = {
      playerName: ''
    };
  }

  componentDidMount() {
    document.body.addEventListener('keyup', this.onKeyUp);
  }

  componentWillUnmount() {
    document.body.removeEventListener('keyup', this.onKeyUp);
  }

  onKeyUp = ({ key }) => {
    if (this.props.playerIndex == null) {
      return;
    }
    let playerName = this.state.playerName;
    if (key.match(/^[a-z]$/i)) {
      playerName = playerName + key;
      playerName = playerName.substr(0, 3);
    } else if (key === 'Backspace') {
      playerName = playerName.substr(0, playerName.length - 1);
    }
    this.setState({
      playerName
    });
    this.props.onPlayerNameChange(playerName);
  }

  render() {
    const { scores = [], playerIndex } = this.props;
    const { playerName } = this.state;
    return <Layout title={
      <div style={{ fontSize: '8vh' }}>Pit Trader</div>
    }>
      <div style={{ width: '50%', margin: 'auto', fontSize: '4vh', background: 'white', textAlign: 'center' }}>
        <p>High Scores</p>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <td>----</td>
              <td>-----</td>
              <td>----</td>
            </tr>
            <tr>
              <td>Rank</td>
              <td>Score</td>
              <td>Name</td>
            </tr>
            <tr>
              <td>----</td>
              <td>-----</td>
              <td>----</td>
            </tr>
          </thead>
          <tfoot>
            <tr>
              <td>----</td>
              <td>-----</td>
              <td>----</td>
            </tr>
          </tfoot>
          <tbody>
            {
              scores.map(({ score, name }, index) => {
                return <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{currency(score)}</td>
                  <td>{playerIndex === index ? playerName : name}</td>
                </tr>;
              })
            }
          </tbody>
        </table>
        <p></p>
      </div>
    </Layout >
  }
}