import axios from 'axios';
// should be in environment variable
const API_URL = 'https://script.google.com/macros/s/AKfycbyB9RCmichWXMagPaG0HKz3jHOlZ2-Dnkxsr75ay-111xssfEYmNc12l9Fpiltl599TkA/exec';

export const createPost = async (postData) => {
  const response = await axios.post(API_URL, postData);
  return response.data;
};