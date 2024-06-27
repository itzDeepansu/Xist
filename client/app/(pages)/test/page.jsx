"use client"
import React , {useState} from 'react'
import axios from 'axios'

const page = () => {
    const [image, setImage] = useState(null)
    const UploadFile = async() => {
        const data = new FormData()
        data.append('file', image)
        data.append('upload_preset', 'non_secure_images_preset')
        try{
            let api = `https://api.cloudinary.com/v1_1/dcqjqvajd/image/upload`
            const res =await axios.post(api,data)
            const {secure_url} = res.data
            console.log(secure_url);
            return secure_url
        }catch(err){
            console.log(err);
        }
    }
    const handleSubmit = async(e) => {
        e.preventDefault()
        try{
            const imgUrl = await UploadFile()
        }catch(err){
            console.log(err);
        }
    }
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" accept='image/*' id="image" onChange={(e)=>setImage(e.target.files[0])} />
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default page
