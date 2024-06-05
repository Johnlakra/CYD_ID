"use client";

// React Imports
import { useState } from "react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, Controller } from "react-hook-form";

//Axios
import axios from "axios";

// MUI Imports
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import EncodeBase64 from "./EncodeBase64";
import dayjs from "dayjs";
import IDCard from "./IDCard";

const schema = yup.object().shape({
  name: yup.string().required("Name is required."),
  father_name: yup.string().required("Father's name is required."),
  mother_name: yup.string().required("Mother's name is required."),
  date_of_birth: yup.date().required("Date of Birth is required.").nullable(),
  date_of_baptism: yup
    .date()
    .required("Date of Baptism is required.")
    .nullable(),
  postal_address: yup.string().required("Postal Address is required."),
  parish: yup.string().required("Parish is required."),
  deanery: yup.string().required("Deanery is required."),
  educational_qualifiation: yup
    .string()
    .required("Educational Qualification is required."),
  phone: yup
    .string()
    .required("Phone is required.")
    .matches(/^[0-9]{10}$/, "Invalid phone number format."),
  involvement: yup.string().required("Involvement since is required."),
});

const deaneries = {
  AJNALA: [
    "Ajnala",
    "Chamiyari",
    "Chogawan",
    "Chuchakwal",
    "Karyal",
    "Othian",
    "Punga",
    "Ramdas",
  ],
  AMRITSAR: [
    "Amritsar Cantt.",
    "Bharariwal",
    "Gumtala",
    "Khasa",
    "Lahorigate",
    "Majitha Road",
    "Nai Abadi",
    "Rajasansi",
  ],
  DHARIWAL: [
    "Batala",
    "Dhariwal",
    "Dialgarh",
    "Kalanaur",
    "Mastkot",
    "Naushera Majja Singh",
    "Qadian",
    "Sri Hargobindpur",
  ],
  "FATEHGARH CHURIAN": [
    "Fatehgarh Churian",
    "Dera Baba Nanak",
    "Dharamkot Randhawa",
    "Ghanie ke Banger",
    "Kotli",
    "Machi Nangal",
    "Majitha",
    "Pakharpura",
  ],
  FEROZPUR: [
    "Faridkot",
    "Ferozepur Badhni Jaimal Singh",
    "Ferozpur Canal Colony",
    "Ferozpur Cantt",
    "Ferozpur City",
    "Gulami Wala",
    "Guru Har Sahai",
    "Lohgarh-Sur Singh Wala",
    "Mamdot",
    "Mudki",
    "Sadiq",
    "Talwandi Bhai",
    "Tehna, Faridkot",
  ],
  GURDASPUR: [
    "Balun",
    "Dalhousie",
    "Dina Nagar",
    "Dorangala",
    "Gurdaspur",
    "Jandwal, Pathankot",
    "Kahnuwan",
    "Narot Jaimal Singh",
    "Pathankot City",
    "Puranashalla",
    "Sidhwan Jamita",
    "Sujanpur, Pathankot",
  ],
  HOSHIARPUR: [
    "Kakkon",
    "Baijnath",
    "Balachaur",
    "Bassi Bahian",
    "Bhunga",
    "Gaggal",
    "Garshankar",
    "Jindwari",
    "Mehtiana, Khanaura",
    "Nandachaur",
    "Nangal",
    "Palampur",
    "Una",
    "Yol Camp",
  ],
  "JALANDHAR CANTT.": [
    "Apra",
    "Banga",
    "Behram",
    "Dhina-Chittewani",
    "Jalandhar Cantt",
    "Jandiala Manjki",
    "Nawanshahar",
    "Phagwara",
    "Phulriwal",
    "Rawalpindi",
    "Sansarpur",
  ],
  "JALANDHAR CITY": [
    "Adampur",
    "Bootan",
    "Chogitty",
    "Gakhalan",
    "Jalandhar City",
    "Lambapind",
    "Maqsudan-Nadanpur",
  ],
  KAPURTHALA: [
    "Hussainpur",
    "Kapurthala",
    "Kartarpur",
    "Mehatpur",
    "Nakodar",
    "Shahkot",
    "Sultanpur Lodhi",
  ],
  LUDHIANA: [
    "BRS Nagar",
    "Jagraon",
    "Jalandhar Bypass, Ludhiana",
    "Kidwai Nagar",
    "Phillaur",
    "Raekot",
    "Sarabha Nagar",
  ],
  MOGA: [
    "Baghapurana",
    "Buggipura",
    "Buttar",
    "Dharamkot, Moga",
    "Kot-Ise-Khan, Moga",
    "Makhu",
    "Moga",
    "Nihal Singh Wala, Moga",
    "Singhanwala, Moga",
    "Zira",
  ],
  MUKTSAR: [
    "Abohar",
    "Bhagsar",
    "Danewala",
    "Fazilka",
    "Gidderbaha",
    "Jaiton",
    "Jalalabad",
    "Kotkapura",
    "Malout Pind",
    "Malout",
    "Muktsar, Bir Sarkar",
    "Muktsar",
    "Panjgaraian",
    "Sikhwala",
  ],
  SAHNEWAL: [
    "Bhammian Kalan",
    "Jamalpur",
    "Khanna",
    "Khanpur-Jassar-Sangowal-Rania",
    "Machhiwara",
    "Machian Khurd",
    "Sahnewal",
    "Samrala",
  ],
  TANDA: ["Bhogpur", "Bholath", "Dasuya", "Mukerian", "Tanda", "Kishangarh"],
  "TARN TARAN": [
    "Akalgarh",
    "Beas",
    "Bhikhiwind",
    "Bhojian",
    "Chabhal",
    "Fatehabad",
    "Harike",
    "Jandiala Guru",
    "Khem Karan",
    "Patti",
    "Tarn Taran",
  ],
};


const FormDetails = () => {
  const initialData = {
    name: "",
    father_name: "",
    mother_name: "",
    date_of_birth: "",
    date_of_baptism: "",
    postal_address: "",
    parish: "",
    deanery: "",
    educational_qualifiation: "",
    phone: "",
    involvement: "",
  };
  // States
  const [formData, setFormData] = useState(initialData);
  const [fileInput, setFileInput] = useState("");
  const [imgSrc, setImgSrc] = useState("/images/avatars/1.png");
  const [loading, setLoading] = useState(false);
  const [selectedDeanery, setSelectedDeanery] = useState(
    Object.keys(deaneries)[0]
  );
  // Browse for image
  const handleFileInputChange = async (file) => {
    const { files } = file.target;

    await EncodeBase64(files[0])
      .then((base64) => {
        if (base64 !== null) {
          setFileInput(base64);
          setImgSrc(base64);
        }
      })
      .catch(() => {
        console.log("File conversion error");
      });
  };

  // Reset image
  const handleFileInputReset = () => {
    setFileInput("");
    setImgSrc("/images/avatars/1.png");
  };

  //UseForm
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  // Submit form
  const onSubmit = async (data) => {
    console.log(data);
    const payload = { ...data, photo:fileInput };
    console.log(payload,'payload');
    setLoading(true);
    try {
      const response = await axios.post("http://localhost", {
        ...payload,
        date_of_baptism: dayjs(payload.date_of_baptism).format("YYYY-MM-DD"),
        date_of_birth: dayjs(payload.date_of_birth).format("YYYY-MM-DD"),
      });
      console.log(response.data);
      setFormData({
        ...payload,
        date_of_baptism: dayjs(payload.date_of_baptism).format("YYYY-MM-DD"),
        date_of_birth: dayjs(payload.date_of_birth).format("YYYY-MM-DD"),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  console.log(watch());
  // Main
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      p={2}
    >
      <Card
        sx={{
          maxWidth: 900,
          width: "100%",
          boxShadow: 3,
          backgroundColor: "#F7F7F9",
        }}
      >
        <CardHeader title="Form Details" />
        <CardContent>
          <Box mb={2}>
            <Typography variant="h6">Upload Photo</Typography>
            <Box className="flex max-sm:flex-col items-center gap-6" mt={1}>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                mr={2}
              >
                <img
                  src={imgSrc}
                  alt="Avatar"
                  style={{
                    width: 100,
                    height: 100,
                    backgroundColor: "white",
                    // borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                <Button
                  variant="outlined"
                  color="primary"
                  component="label"
                  size="small"
                  sx={{ mt: 1 }}
                >
                  Browse
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileInputChange}
                  />
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={handleFileInputReset}
                >
                  Reset
                </Button>
                <Typography variant="body2" color="textSecondary" mt={2}>
                  Allowed PNG or JPEG. Max size of 800K.
                </Typography>
              </Box>
            </Box>
          </Box>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Name"
                      variant="outlined"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="father_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Father's Name"
                      variant="outlined"
                      fullWidth
                      error={!!errors.father_name}
                      helperText={errors.father_name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="mother_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Mother's Name"
                      variant="outlined"
                      fullWidth
                      error={!!errors.mother_name}
                      helperText={errors.mother_name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="date_of_birth"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Date of Birth"
                      type="date"
                      variant="outlined"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.date_of_birth}
                      helperText={errors.date_of_birth?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="date_of_baptism"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Date of Baptism"
                      type="date"
                      variant="outlined"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.date_of_baptism}
                      helperText={errors.date_of_baptism?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="postal_address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Postal Address"
                      variant="outlined"
                      fullWidth
                      error={!!errors.postal_address}
                      helperText={errors.postal_address?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  variant="outlined"
                  error={!!errors.deanery}
                >
                  <InputLabel>Deanery</InputLabel>
                  <Controller
                    name="deanery"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Deanery"
                        value={selectedDeanery || ""}
                        onChange={(e) => {
                          field.onChange(e);
                          setSelectedDeanery(e.target.value);
                        }}
                      >
                        {Object.keys(deaneries).map((deanery) => (
                          <MenuItem key={deanery} value={deanery}>
                            {deanery}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <Typography variant="body2" color="error">
                    {errors.deanery?.message}
                  </Typography>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  variant="outlined"
                  error={!!errors.parish}
                >
                  <InputLabel>Parish</InputLabel>
                  <Controller
                    name="parish"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Parish"
                        onChange={(e) => {
                          field.onChange(e);
                        }}
                      >
                        {selectedDeanery && deaneries[selectedDeanery] ? (
                          deaneries[selectedDeanery].map((parish) => (
                            <MenuItem key={parish} value={parish}>
                              {parish}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                        )}
                      </Select>
                    )}
                  />
                  <Typography variant="body2" color="error">
                    {errors.parish?.message}
                  </Typography>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="educational_qualifiation"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Educational Qualification"
                      variant="outlined"
                      fullWidth
                      error={!!errors.educational_qualifiation}
                      helperText={errors.educational_qualifiation?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Phone"
                      variant="outlined"
                      fullWidth
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="involvement"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Involvement since"
                      variant="outlined"
                      fullWidth
                      error={!!errors.involvement}
                      helperText={errors.involvement?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between">
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => reset(initialData)}
                    disabled={loading}
                  >
                    Reset
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
          {formData && <IDCard data={formData} />}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FormDetails;