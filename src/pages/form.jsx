'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import useSWRMutation from 'swr/mutation'
import { nanoid } from 'nanoid'


async function sendRequest(url, { arg }) {
    return fetch(url, {
      method: 'POST',
      body: JSON.stringify(arg)
    }).then(res => res.json())
  }
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
  const [imgSrc, setImgSrc] = useState('/images/avatars/1.png')
  const { trigger, isMutating } = useSWRMutation(api, sendRequest, /* options */)
    console.log(api, "api")
//   const handleDelete = value => {
//     setLanguage(current => current.filter(item => item !== value))
//   }

//   const handleChange = event => {
//     setLanguage(event.target.value)
//   }

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
    // Check other condition
    if(imgSrc.length > 50000){
        // show Error toast
        return
    }
    try {
        console.log(imgSrc, "imgSrc")
        const payload = {
            id: nanoid(),
            name: formData.name,
            father_name: formData.father_name,
            mother_name: formData.mother_name,
            date_of_birth: formData.date_of_birth,
            date_of_baptism: formData.date_of_baptism,
            postal_address: formData.postal_address,
            parish: formData.parish,
            deanery: formData.deanery,
            educational_qualifiation: formData.educational_qualifiation,
            phone: formData.phone,
            involvement: formData.involvement,
            form_upload: "test", 
            photo: imgSrc 
        }
        const result = await trigger(payload)
        console.log(result, "result")
    } catch (error) {
        // error handling
        console.log('Somthing went wrong')
    }
    // console.log('Form Data Submitted:', payload);
  };
//   "form_upload": "test",
  return (
    <Card>
      <CardContent className='mbe-5'>
        <div className='flex max-sm:flex-col items-center gap-6'>
          <img height={100} width={100} className='rounded-xl' src={imgSrc} alt='Profile' />
          <div className='flex flex-grow flex-col gap-4'>
            <div className='flex flex-col sm:flex-row gap-4'>
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
              <Button variant='outlined' color='error' onClick={handleFileInputReset}>
                Reset
              </Button>
            </div>
            <Typography>Allowed JPG, GIF or PNG. Max size of 800K</Typography>
          </div>
        </div>
      </CardContent>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>
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
                {/* Date picker */}
              <TextField
                fullWidth
                label='Date of birth'
                value={formData.date_of_birth}
                onChange={e => handleFormChange('date_of_birth', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Date of baptism'
                value={formData.date_of_baptism}
                onChange={e => handleFormChange('date_of_baptism', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Postal address'
                value={formData.postal_address}
                onChange={e => handleFormChange('postal_address', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Parish'
                value={formData.parish}
                onChange={e => handleFormChange('parish', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Deanery'
                value={formData.deanery}
                onChange={e => handleFormChange('deanery', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Educational qualifiation'
                value={formData.educational_qualifiation}
                onChange={e => handleFormChange('educational_qualifiation', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='phone'
                value={formData.phone}
                onChange={e => handleFormChange('phone', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='involvement'
                value={formData.involvement}
                onChange={e => handleFormChange('involvement', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} className='flex gap-4 flex-wrap pbs-6'>
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
  )
}

export default FormDetails
