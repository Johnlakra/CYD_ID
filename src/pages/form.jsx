'use client'

// React Imports
import { useState } from 'react'
import * as yup from 'yup'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import useSWRMutation from 'swr/mutation'
import { nanoid } from 'nanoid'
import { Box, FormControl, MenuItem } from '@mui/material'

async function sendRequest(url, { arg }) {
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(arg)
    }).then(res => res.json())
}

const schema = yup.object().shape({
    name: yup.string().required('Name is required.'),
    father_name: yup.string().required("Father's name is required."),
    mother_name: yup.string().required("Mother's name is required."),
    date_of_birth: yup.date().required('Date of Birth is required.').nullable(),
    date_of_baptism: yup.date().required('Date of Baptism is required.').nullable(),
    postal_address: yup.string().required('Postal Address is required.'),
    parish: yup.string().required('Parish is required.'),
    deanery: yup.string().required('Deanery is required.'),
    educational_qualifiation: yup.string().required('Educational Qualification is required.'),
    phone: yup.string().required('Phone is required.').matches(/^[0-9]{10}$/, 'Invalid phone number format.'),
    involvement: yup.string().required('Involvement since is required.'),
});

const deaneries = {
    "AJNALA": ["Ajnala", "Chamiyari", "Chogawan", "Chuchakwal", "Karyal", "Othian", "Punga", "Ramdas"],
    "AMRITSAR": ["Amritsar Cantt.", "Bharariwal", "Gumtala", "Khasa", "Lahorigate", "Majitha Road", "Nai Abadi", "Rajasansi"],
    "DHARIWAL": ["Batala", "Dhariwal", "Dialgarh", "Kalanaur", "Mastkot", "Naushera Majja Singh", "Qadian", "Sri Hargobindpur"],
    "FATEHGARH CHURIAN": ["Fatehgarh Churian", "Dera Baba Nanak", "Dharamkot Randhawa", "Ghanie ke Banger", "Kotli", "Machi Nangal", "Majitha", "Pakharpura"],
    "FEROZPUR": ["Faridkot", "Ferozepur Badhni Jaimal Singh", "Ferozpur Canal Colony", "Ferozpur Cantt", "Ferozpur City", "Gulami Wala", "Guru Har Sahai", "Lohgarh-Sur Singh Wala", "Mamdot", "Mudki", "Sadiq", "Talwandi Bhai", "Tehna, Faridkot"],
    "GURDASPUR": ["Balun", "Dalhousie", "Dina Nagar", "Dorangala", "Gurdaspur", "Jandwal, Pathankot", "Kahnuwan", "Narot Jaimal Singh", "Pathankot City", "Puranashalla", "Sidhwan Jamita", "Sujanpur, Pathankot"],
    "HOSHIARPUR": ["Kakkon", "Baijnath", "Balachaur", "Bassi Bahian", "Bhunga", "Gaggal", "Garshankar", "Jindwari", "Mehtiana, Khanaura", "Nandachaur", "Nangal", "Palampur", "Una", "Yol Camp"],
    "JALANDHAR CANTT.": ["Apra", "Banga", "Behram", "Dhina-Chittewani", "Jalandhar Cantt", "Jandiala Manjki", "Nawanshahar", "Phagwara", "Phulriwal", "Rawalpindi", "Sansarpur"],
    "JALANDHAR CITY": ["Adampur", "Bootan", "Chogitty", "Gakhalan", "Jalandhar City", "Lambapind", "Maqsudan-Nadanpur"],
    "KAPURTHALA": ["Hussainpur", "Kapurthala", "Kartarpur", "Mehatpur", "Nakodar", "Shahkot", "Sultanpur Lodhi"],
    "LUDHIANA": ["BRS Nagar", "Jagraon", "Jalandhar Bypass, Ludhiana", "Kidwai Nagar", "Phillaur", "Raekot", "Sarabha Nagar"],
    "MOGA": ["Baghapurana", "Buggipura", "Buttar", "Dharamkot, Moga", "Kot-Ise-Khan, Moga", "Makhu", "Moga", "Nihal Singh Wala, Moga", "Singhanwala, Moga", "Zira"],
    "MUKTSAR": ["Abohar", "Bhagsar", "Danewala", "Fazilka", "Gidderbaha", "Jaiton", "Jalalabad", "Kotkapura", "Malout Pind", "Malout", "Muktsar, Bir Sarkar", "Muktsar", "Panjgaraian", "Sikhwala"],
    "SAHNEWAL": ["Bhammian Kalan", "Jamalpur", "Khanna", "Khanpur-Jassar-Sangowal-Rania", "Machhiwara", "Machian Khurd", "Sahnewal", "Samrala"],
    "TANDA": ["Bhogpur", "Bholath", "Dasuya", "Mukerian", "Tanda", "Kishangarh"],
    "TARN TARAN": ["Akalgarh", "Beas", "Bhikhiwind", "Bhojian", "Chabhal", "Fatehabad", "Harike", "Jandiala Guru", "Khem Karan", "Patti", "Tarn Taran"],
};
const initialData = {
    name: '',
    father_name: '',
    mother_name: '',
    date_of_birth: '',
    date_of_baptism: '',
    postal_address: '',
    parish: '',
    deanery: '',
    educational_qualifiation: '',
    phone: '',
    involvement: '',
}
const api = process.env.API_URL || "https://script.google.com/macros/s/AKfycbyB9RCmichWXMagPaG0HKz3jHOlZ2-Dnkxsr75ay-111xssfEYmNc12l9Fpiltl599TkA/exec"

const FormDetails = () => {
    // States
    const [formData, setFormData] = useState(initialData)
    const [fileInput, setFileInput] = useState('')
    const [selectedDeanery, setSelectedDeanery] = useState('');
    const [imgSrc, setImgSrc] = useState('/images/avatars/1.png')
    const { trigger, isMutating } = useSWRMutation(api, sendRequest)

    const handleFormChange = (field, value) => {
        setFormData({ ...formData, [field]: value })
    }

    const handleFileInputChange = file => {
        const reader = new FileReader()
        const { files } = file.target

        if (files && files.length !== 0) {
            reader.onload = () => setImgSrc(reader.result)
            reader.readAsDataURL(files[0])

            if (reader.result !== null) {
                setFileInput(reader.result)
            }
        }
    }

    const handleFileInputReset = () => {
        setFileInput('')
        setImgSrc('/images/avatars/1.png')
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (imgSrc.length > 50000) {
            // show Error toast
            return
        }
        try {
            const payload = {
                id: nanoid(),
                ...formData,
                photo: imgSrc
            }
            const result = await trigger(payload)
            console.log(result, "result")
        } catch (error) {
            console.log('Something went wrong')
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" p={2}>
            <Card sx={{ maxWidth: 900, width: '100%' }}>
                <CardHeader title="Personal Details Form" />
                <CardContent>
                    <Box display="flex" justifyContent="center" mb={4}>
                        <Box textAlign="center">
                            <img height={100} width={100} className='rounded-xl' src={imgSrc} alt='Profile' />
                            <Box display="flex" justifyContent="center" mt={2}>
                                <Button component='label' variant='contained' htmlFor='account-settings-upload-image'>
                                    Upload New Photo
                                    <input
                                        hidden
                                        type='file'
                                        value={fileInput}
                                        accept='image/png, image/jpeg'
                                        onChange={handleFileInputChange}
                                        id='account-settings-upload-image'
                                    />
                                </Button>
                                <Button variant='outlined' color='error' onClick={handleFileInputReset} sx={{ ml: 2 }}>
                                    Reset
                                </Button>
                            </Box>
                            <Typography mt={1}>Allowed JPG, GIF or PNG. Max size of 800K</Typography>
                        </Box>
                    </Box>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label='First Name'
                                    value={formData.name}
                                    onChange={e => handleFormChange('name', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Father's Name"
                                    value={formData.father_name}
                                    onChange={e => handleFormChange('father_name', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label='Mother Name'
                                    value={formData.mother_name}
                                    onChange={e => handleFormChange('mother_name', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label='Date of birth'
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.date_of_birth}
                                    onChange={e => handleFormChange('date_of_birth', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label='Date of baptism'
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.date_of_baptism}
                                    onChange={e => handleFormChange('date_of_baptism', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label='Postal address'
                                    multiline
                                    rows={4}
                                    value={formData.postal_address}
                                    onChange={e => handleFormChange('postal_address', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <TextField
                                        select
                                        label="Deanery"
                                        value={formData.deanery}
                                        onChange={(e) => {
                                            setSelectedDeanery(e.target.value);
                                            handleFormChange('deanery', e.target.value);
                                        }}
                                    >
                                        {Object.keys(deaneries).map((deanery) => (
                                            <MenuItem key={deanery} value={deanery}>
                                                {deanery}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <TextField
                                        select
                                        label="Parish"
                                        value={formData.parish}
                                        onChange={(e) => handleFormChange('parish', e.target.value)}
                                    >
                                        {selectedDeanery &&
                                            deaneries[selectedDeanery].map((parish) => (
                                                <MenuItem key={parish} value={parish}>
                                                    {parish}
                                                </MenuItem>
                                            ))}
                                    </TextField>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label='Educational Qualification'
                                    value={formData.educational_qualifiation}
                                    onChange={e => handleFormChange('educational_qualifiation', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label='Phone'
                                    value={formData.phone}
                                    onChange={e => handleFormChange('phone', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Involvement Since"
                                    value={formData.involvement}
                                    onChange={(e) => handleFormChange('involvement', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2}>
                                <Button variant='contained' type='submit' disabled={isMutating}>
                                    Save Changes
                                </Button>
                                <Button variant='outlined' type='reset' color='secondary' onClick={() => setFormData(initialData)}>
                                    Reset
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
        </Box>
    )
}

export default FormDetails
