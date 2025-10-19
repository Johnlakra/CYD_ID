/* eslint-disable react/jsx-no-undef */
"use client";

// React Imports
import { useState, useEffect } from "react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, Controller } from "react-hook-form";

// Axios
import axios from "axios";

// MUI Imports
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  IconButton,
} from "@mui/material";
import EncodeBase64 from "../components/EncodeBase64";
import dayjs from "dayjs";
import IDCard from "../components/IDCard";
import { CalendarMonth, ArrowBack, ContentCopy } from "@mui/icons-material";

// Toast Notifications
import { toast } from "react-toastify";
import { baseURL } from "../api/apiClient";

const schema = yup.object().shape({
  name: yup.string().required("Name is required."),
  father_name: yup.string().required("Father's name is required."),
  mother_name: yup.string().required("Mother's name is required."),
  date_of_birth: yup.date().required("Date of Birth is required.").nullable(),
  date_of_baptism: yup
    .date()
    .required("Date of Baptism is required.")
    .nullable(),
    issue_date: yup.date().required("Issue Date is required.").nullable(),
  postal_address: yup.string().required("Postal Address is required."),
  parish: yup.string().required("Parish is required."),
  deanery: yup.string().required("Deanery is required."),
  qualification: yup
    .string()
    .required("Educational Qualification is required."),
  phone: yup
    .string()
    .required("Phone is required.")
    .matches(/^[0-9]{10}$/, "Invalid phone number format."),
  involvement: yup.string().required("Involvement since is required."),
  level: yup.string().required("Level is required."),
  designation: yup.string().required("Designation is required."),
});

// Define options for Level and Designation dropdowns
const levelOptions = ["parish", "deanery", "dexco"];

const designationOptions = [
  "Member",
  "President",
  "Vice-President",
  "Secretary",
  "Joint Secretary",
  "Treasurer",
  "Joint Treasurer",
  "Media Secretary",
  "Joint Media Secretary",
  "Boy Representative",
  "Girl Representative",
  "Boy Spokesperson",
  "Girl Spokesperson",
];

const FormDetails = ({ authToken, user, onLogout, editProfile, onEditComplete }) => {

  const deaneries = {
  Ajnala: [
    "Ajnala ",
    "Chamiyari",
    "Chogawan",
    "Chuchakwal",
    "Karyal",
    "Othian",
    "Punga",
    "Ramdas",
  ],
  Amritsar: [
    "Amritsar Cantt.",
    "Bharariwal",
    "Gumtala",
    "Khasa",
    "Lahorigate",
    "Majitha Road",
    "Nai Abadi",
    "Rajasansi",
  ],
  Dhariwal: [
    "Batala",
    "Dhariwal",
    "Dialgarh",
    "Kalanaur",
    "Mastkot",
    "Naushera Majja Singh",
    "Qadian",
  ],
  "Fatehgarh Churian": [
    "Fatehgarh Churian",
    "Dera Baba Nanak",
    "Dharamkot Randhawa",
    "Ghanie Ke Banger",
    "Kotli",
    "Machi Nangal",
    "Majitha",
    "Pakharpura",
  ],
  Ferozpur: [
    "Faridkot",
    "Ferozepur Badhni Mahafariste Wala",
    "Ferozpur Canal Colony",
    "Ferozpur Cantt",
    "Ferozpur City",
    "Gulami Wala",
    "Guru Har Sahai",
    "Lohgarh-Sur Singh Wala (Station)",
    "Mamdot",
    "Mudki (Station)",
    "Sadiq",
    "Talwandi Bhai",
    "Tehna, Faridkot",
  ],
  Gurdaspur: [
    "Balun (Station)",
    "Dalhousie",
    "Dina Nagar",
    "Dorangala",
    "Gurdaspur",
    "Jandwal, Pathankot",
    "Kahnuwan",
    "Narot Jaimal Singh (Station)",
    "Pathankot City",
    "Puranashalla",
    "Sidhwan Jamita, Joura Chitra",
    "Sujanpur, Pathankot",
  ],
  Hoshiarpur: [
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
  "Jalandhar Cantt.": [
    "Apra",
    "Banga (Station)",
    "Behram (Station)",
    "Dhina-Chittewani",
    "Jalandhar Cantt",
    "Jandiala Manjki",
    "Nawanshahar",
    "Phagwara",
    "Phulriwal",
    "Rawalpindi",
    "Sansarpur",
  ],
  "Jalandhar City": [
    "Adampur",
    "Bootan",
    "Chogitty",
    "Gakhalan",
    "Jalandhar City",
    "Lambapind",
    "Maqsudan",
  ],
  Kapurthala: [
    "Hussainpur- Lodhi Bhulana",
    "Kapurthala",
    "Kishangarh",
    "Kartarpur",
    "Mehatpur",
    "Nakodar",
    "Shahkot",
    "Sultanpur Lodhi",
  ],
  Ludhiana: [
    "BRS Nagar",
    "Jagraon",
    "Jalandhar Bypass, Ludhiana",
    "Kidwai Nagar",
    "Phillaur",
    "Raekot",
    "Sarabha Nagar",
  ],
  Moga: [
    "Baghapurana",
    "Buggipura, Moga (Station)",
    "Buttar, Moga (Station)",
    "Dharamkot, Moga",
    "Kot-Ise-Khan, Moga (Station)",
    "Makhu",
    "Moga",
    "Nihal Singh Wala, Moga (Station)",
    "Singhanwala, Moga",
    "Takhtupura",
    "Zira",
  ],
  Muktsar: [
    "Abohar",
    "Bhagsar",
    "Danewala",
    "Enakhera",
    "Fazilka",
    "Gidderbaha (Station)",
    "Jaiton",
    "Jalalabad",
    "Kotkapura",
    "Malout Pind",
    "Malout",
    "Muktsar, Bir Sarkar",
    "Muktsar",
    "Panjgaraian (Station)",
    "Sikhwala",
  ],
  Sahnewal: [
    "Bhammian Kalan (Station)",
    "Jamalpur",
    "Khanna",
    "Khanpur-Jassar-Sangowal-Rania",
    "Machhiwara",
    "Machian Khurd",
    "Sahnewal",
    "Samrala",
  ],
  Tanda: [
    "Bhogpur",
    "Bholath",
    "Dasuya",
    "Mukerian",
    "Tanda",
    "Sri Hargobindpur",
  ],
  "Tarn Taran": [
    "Akalgarh (Station)",
    "Beas",
    "Bhikhiwind",
    "Bhojian",
    "Chabhal (Station)",
    "Fatehabad (Station)",
    "Harike",
    "Jandiala Guru",
    "Khem Karan",
    "Patti",
    "Tarn Taran",
  ],
};

  const firstDeanery = "";

  const initialData = {
    name: "",
    father_name: "",
    mother_name: "",
    date_of_birth: "",
    date_of_baptism: "",
    issue_date: dayjs().format("YYYY-MM-DD"),
    postal_address: "",
    parish: "",
    deanery: firstDeanery,
    qualification: "",
    phone: "",
    involvement: "",
    level: "",
    designation: "",
  };

    const formatDateForInput = (dateValue) => {
    if (!dateValue) return "";
    
    // If it's already in YYYY-MM-DD format, return as is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // Convert ISO date string to YYYY-MM-DD format
    try {
      return dayjs(dateValue).format("YYYY-MM-DD");
    } catch (error) {
      console.error('Date formatting error:', error);
      return "";
    }
  };

  // States
  const [formData, setFormData] = useState(initialData);
  const [fileInput, setFileInput] = useState("");
  const [imgSrc, setImgSrc] = useState("");
  const [loading, setLoading] = useState(false);
  const [issueDateOpen, setIssueDateOpen] = useState(false);
  const [selectedDeanery, setSelectedDeanery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [credentials, setCredentials] = useState(null);

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
    setImgSrc("");
  };

  // UseForm
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: initialData
  });

  // Load edit data when editProfile changes
  useEffect(() => {
    if (editProfile) {
      // Map database field names to form field names
      const editData = {
        name: editProfile.name || "",
        father_name: editProfile.father || "",
        mother_name: editProfile.mother || "",
        date_of_birth: formatDateForInput(editProfile.dob),
        date_of_baptism: formatDateForInput(editProfile.date_of_baptism),
        issue_date: formatDateForInput(editProfile.issue_date) || dayjs().format("YYYY-MM-DD"),
        postal_address: editProfile.postal_address || "",
        parish: editProfile.parish || "",
        deanery: editProfile.deanery || "",
        qualification: editProfile.qualification || "",
        phone: editProfile.phone || "",
        involvement: editProfile.involvement || "",
        level: editProfile.level || "",
        designation: editProfile.designation || "",
      };

      // Reset form with edit data
      reset(editData);
      setFormData(editData);
      
      // Set image if exists
      if (editProfile.photo_url) {
        setFileInput(editProfile.photo_url);
        setImgSrc(editProfile.photo_url);
      }
      
      // Set selected deanery for parish dropdown
      if (editProfile.deanery) {
        setSelectedDeanery(editProfile.deanery);
      }
    } else {
      // Reset form for new profile
      reset(initialData);
      setFormData(initialData);
      setFileInput("");
      setImgSrc("");
      setSelectedDeanery("");
    }
  }, [editProfile, reset]);

  // Submit form
  const onSubmit = async (data) => {
    if (!authToken) {
      toast.error('Please login first');
      return;
    }

    if (!fileInput) {
      toast.error('Please upload a photo');
      return;
    }

    const payload = { ...data, photo: fileInput };
    setLoading(true);
    
    try {
      const url = editProfile 
        ? `${baseURL}/profiles/${editProfile.id}` 
        : `${baseURL}/profiles`;
      
      const method = editProfile ? 'put' : 'post';
      
      const response = await axios[method](url, {
        ...payload,
        date_of_baptism: dayjs(payload.date_of_baptism).format("YYYY-MM-DD"),
        date_of_birth: dayjs(payload.date_of_birth).format("YYYY-MM-DD"),
        issue_date: dayjs(payload.issue_date).format("YYYY-MM-DD"),
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setFormData({
          ...payload,
          date_of_baptism: dayjs(payload.date_of_baptism).format("YYYY-MM-DD"),
          date_of_birth: dayjs(payload.date_of_birth).format("YYYY-MM-DD"),
          issue_date: dayjs(payload.issue_date).format("YYYY-MM-DD"),
        });

        // Store credentials if profile was created (not edited)
        if (!editProfile && response.data.data.credentials) {
          setCredentials(response.data.data.credentials);
        }
        
        toast.success(editProfile ? "Profile updated successfully!" : "Profile created successfully!");
        setOpenDialog(true);
        
        // If editing, call completion callback after short delay
        if (editProfile && onEditComplete) {
          setTimeout(() => {
            onEditComplete();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        onLogout();
      } else {
        toast.error(error.response?.data?.message || `Failed to ${editProfile ? 'update' : 'create'} profile`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to reset the form
  const resetForm = () => {
    try {
      if (editProfile) {
        // If editing, go back to manage profiles
        if (onEditComplete) {
          onEditComplete();
        }
      } else {
        // If creating new, reset form
        reset(initialData);
        setFormData(initialData);
        setFileInput("");
        setImgSrc("");
        setSelectedDeanery("");
      }
    } catch (error) {
      console.error('Error resetting form:', error);
    }
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {editProfile && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography>Editing profile for: <strong>{editProfile.name}</strong></Typography>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => onEditComplete && onEditComplete()}
              size="small"
            >
              Back to Manage
            </Button>
          </Box>
        </Alert>
      )}

      <Typography variant="h4" gutterBottom sx={{ fontWeight: 300, mb: 1 }}>
        {editProfile ? 'Edit ID Card Profile' : 'Create ID Card'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {editProfile ? 'Update the profile information below' : 'Fill out the form below to generate your digital ID card'}
      </Typography>

      <Card
        sx={{
          maxWidth: 'none',
          boxShadow: 3,
          backgroundColor: "#ffffff",
          borderRadius: 3,
        }}
      >
        <CardHeader 
          title="Personal Information" 
          action={
            <Button
              onClick={() => setIssueDateOpen(true)}
              sx={{
                minWidth: { xs: 'auto', sm: 'auto' },
                px: { xs: 1, sm: 2 },
                py: 1,
                backgroundColor: '#f5f5f5',
                color: '#666',
                '&:hover': { backgroundColor: '#e0e0e0' }
              }}
              variant="outlined"
              size="small"
              startIcon={<CalendarMonth fontSize="small" />}
            >
              <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' }, fontSize: '0.75rem' }}>
                Issue Date
              </Typography>
            </Button>
          }
        />
        <CardContent>
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>Upload Photo</Typography>
            <Box className="flex max-sm:flex-col items-center gap-6" mt={1}>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
              >
                <img
                  src={imgSrc || '/images/avatars/1.png'}
                  alt="Avatar"
                  style={{
                    width: 120,
                    height: 120,
                    backgroundColor: "white",
                    objectFit: "cover",
                    borderRadius: 12,
                    border: '2px solid #e0e0e0',
                  }}
                />
                <Box display="flex" gap={1} mt={2}>
                  <Button
                    variant="outlined"
                    color="primary"
                    component="label"
                    size="small"
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
                    onClick={handleFileInputReset}
                  >
                    Reset
                  </Button>
                </Box>
                <Typography variant="body2" color="textSecondary" mt={1} textAlign="center">
                  Allowed PNG or JPEG. Max size of 800K.
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
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
                  name="qualification"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Educational Qualification"
                      variant="outlined"
                      fullWidth
                      error={!!errors.qualification}
                      helperText={errors.qualification?.message}
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
              <Grid item xs={12} sm={6}>
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
                        value={field.value || selectedDeanery}
                        onChange={(e) => {
                          field.onChange(e);
                          setSelectedDeanery(e.target.value);
                          // Reset parish when deanery changes
                          setValue('parish', '');
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
                            <em>Select Deanery First</em>
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
                <FormControl
                  fullWidth
                  variant="outlined"
                  error={!!errors.level}
                >
                  <InputLabel>Level</InputLabel>
                  <Controller
                    name="level"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Level">
                        <MenuItem value="">
                          <em>Select Level</em>
                        </MenuItem>
                        {levelOptions.map((option, index) => (
                          <MenuItem key={index} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <Typography variant="body2" color="error">
                    {errors.level?.message}
                  </Typography>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  variant="outlined"
                  error={!!errors.designation}
                >
                  <InputLabel>Designation</InputLabel>
                  <Controller
                    name="designation"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Designation">
                        <MenuItem value="">
                          <em>Select Designation</em>
                        </MenuItem>
                        {designationOptions.map((option, index) => (
                          <MenuItem key={index} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <Typography variant="body2" color="error">
                    {errors.designation?.message}
                  </Typography>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="postal_address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Postal Address"
                      variant="outlined"
                      multiline
                      rows={3}
                      fullWidth
                      error={!!errors.postal_address}
                      helperText={errors.postal_address?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={resetForm}
                    size="large"
                    sx={{ minWidth: 120 }}
                  >
                    {editProfile ? 'Cancel' : 'Reset'}
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    size="large"
                    sx={{ minWidth: 120 }}
                  >
                    {loading ? (editProfile ? "Updating..." : "Submitting...") : (editProfile ? "Update Profile" : "Generate ID Card")}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editProfile ? 'Profile Updated Successfully' : 'Profile Created Successfully'}
        </DialogTitle>
        <DialogContent>
          {/* Show credentials for new profiles */}
          {!editProfile && credentials && (
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Login Credentials Created
              </Typography>
              <Typography variant="body2" gutterBottom>
                The following credentials have been generated for the profile holder:
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Username:
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                        {credentials.username}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(credentials.username);
                          toast.success('Username copied to clipboard');
                        }}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Password:
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                        {credentials.password}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(credentials.password);
                          toast.success('Password copied to clipboard');
                        }}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Please share these credentials with the profile holder securely. They can use the same login page with these credentials.
                </Typography>
              </Box>
            </Alert>
          )}
          
          <IDCard data={formData} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog
        open={issueDateOpen}
        onClose={() => setIssueDateOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Set Issue Date</DialogTitle>
        <DialogContent>
          <Box mt={1}>
            <Controller
              name="issue_date"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Issue Date"
                  type="date"
                  variant="outlined"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIssueDateOpen(false)} color="primary">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FormDetails;