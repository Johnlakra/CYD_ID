import { Grid } from "@mui/material";
import FormDetails from "./pages/form";

function App() {
  return (
    <Grid container spacing={6}>
      <Grid item xs = {12}>
        <FormDetails/>
      </Grid>
    </Grid>
  );
}

export default App;
