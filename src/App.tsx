import React from 'react';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import './App.css';

function MyField({fieldLabel} : {fieldLabel: string}) {
  return (
    <TextField
      fullWidth
      id="outlined-multiline-static"
      label={fieldLabel}
      multiline
      rows={4}
    />
  );
}

function App() {
  return (
    <div className="App">
      <Grid container spacing={2} columns={2}>
        <Grid item xs={2}>
          <MyField fieldLabel={"Initial text"}/>
        </Grid>
        <Grid item xs={1}>
          <MyField fieldLabel={"User 1"}/>
        </Grid>
        <Grid item xs={1}>
          <MyField fieldLabel={"User 2"}/>
        </Grid>
        <Grid item xs={1}>
          <h2>User 1 result</h2>
          <p>Something</p>
        </Grid>
        <Grid item xs={1}>
          <h2>User 2 result</h2>
          <p>Something else</p>
        </Grid>
      </Grid>
    </div>
  );
}

export default App;
