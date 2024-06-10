import { Grid } from "@mui/material";
import FormDetails from "./pages/form";
 import { ToastContainer } from "react-toastify";
 import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <FormDetails />
        <ToastContainer />
      </Grid>
    </Grid>
  );
}

export default App;
