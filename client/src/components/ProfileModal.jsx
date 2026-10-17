import React, { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { updateUser } from '../features/user/userSlice'
import toast from 'react-hot-toast'

const ProfileModal = ({ setShowEdit }) => {

    const dispatch = useDispatch()

    const user = useSelector((state) => state.user.value)

    const [editForm, setEditForm] = useState({
        username: user?.username || '',
        bio: user?.bio || '',
        location: user?.location || '',
        profile_picture: null,
        cover_photo: null,
        full_name: user?.full_name || '',
    })

    const [isSaving, setIsSaving] = useState(false)

    const handleSaveProfile = async (e) => {
        e.preventDefault()

        try {
            setIsSaving(true)

            const userData = new FormData()

            const {
                full_name,
                username,
                bio,
                location,
                profile_picture,
                cover_photo
            } = editForm

            userData.append('full_name', full_name)
            userData.append('username', username)
            userData.append('bio', bio)
            userData.append('location', location)

            // Add profile image only if a new image was selected
            if (profile_picture) {
                userData.append('profile', profile_picture)
            }

            // Add cover image only if a new image was selected
            if (cover_photo) {
                userData.append('cover', cover_photo)
            }

            const token = localStorage.getItem('token')

            if (!token) {
                toast.error('Please login again')
                return
            }

            // Wait until backend finishes updating
            await dispatch(
                updateUser({
                    userData,
                    token
                })
            ).unwrap()

            toast.success('Profile updated successfully')

            setShowEdit(false)

        } catch (error) {
            console.error('PROFILE UPDATE ERROR:', error)

            toast.error(
                error?.message ||
                'Failed to update profile'
            )

        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className='fixed top-0 bottom-0 left-0 right-0 z-110 h-screen overflow-y-scroll bg-black/50'>

            <div className='max-w-2xl sm:py-6 mx-auto'>

                <div className='bg-white rounded-lg shadow p-6'>

                    {/* Heading */}
                    <h1 className='text-2xl font-bold text-gray-900 mb-6'>
                        Edit Profile
                    </h1>

                    <form
                        className='space-y-4'
                        onSubmit={handleSaveProfile}
                    >

                        {/* =====================================================
                            PROFILE PICTURE
                        ===================================================== */}

                        <div className='flex flex-col items-start gap-3'>

                            <label
                                htmlFor='profile_picture'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Profile Picture

                                <input
                                    hidden
                                    type='file'
                                    accept='image/*'
                                    id='profile_picture'
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]

                                        if (file) {
                                            setEditForm({
                                                ...editForm,
                                                profile_picture: file
                                            })
                                        }
                                    }}
                                />

                                <div className='group/profile relative cursor-pointer'>

                                    <img
                                        src={
                                            editForm.profile_picture
                                                ? URL.createObjectURL(
                                                    editForm.profile_picture
                                                )
                                                : user?.profile_picture ||
                                                  '/profile.png'
                                        }
                                        alt='Profile'
                                        className='w-24 h-24 rounded-full object-cover mt-2'
                                    />

                                    <div className='absolute hidden group-hover/profile:flex top-0 left-0 right-0 bottom-0 bg-black/20 rounded-full items-center justify-center'>

                                        <Pencil className='w-5 h-5 text-white' />

                                    </div>

                                </div>

                            </label>

                        </div>


                        {/* =====================================================
                            COVER PHOTO
                        ===================================================== */}

                        <div className='flex flex-col items-start gap-3'>

                            <label
                                htmlFor='cover_photo'
                                className='block text-sm font-medium text-gray-700 mb-1'
                            >
                                Cover Photo

                                <input
                                    hidden
                                    type='file'
                                    accept='image/*'
                                    id='cover_photo'
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]

                                        if (file) {
                                            setEditForm({
                                                ...editForm,
                                                cover_photo: file
                                            })
                                        }
                                    }}
                                />

                                <div className='group/cover relative cursor-pointer'>

                                    <img
                                        src={
                                            editForm.cover_photo
                                                ? URL.createObjectURL(
                                                    editForm.cover_photo
                                                )
                                                : user?.cover_photo ||
                                                  ''
                                        }
                                        alt='Cover'
                                        className='w-80 h-40 rounded-lg bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 object-cover mt-2'
                                    />

                                    <div className='absolute hidden group-hover/cover:flex top-0 left-0 right-0 bottom-0 bg-black/20 rounded-lg items-center justify-center'>

                                        <Pencil className='w-5 h-5 text-white' />

                                    </div>

                                </div>

                            </label>

                        </div>


                        {/* =====================================================
                            FULL NAME
                        ===================================================== */}

                        <div>

                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Name
                            </label>

                            <input
                                type='text'
                                className='w-full p-3 border border-gray-200 rounded-lg'
                                placeholder='Please enter your full name'
                                value={editForm.full_name}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        full_name: e.target.value
                                    })
                                }
                            />

                        </div>


                        {/* =====================================================
                            USERNAME
                        ===================================================== */}

                        <div>

                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Username
                            </label>

                            <input
                                type='text'
                                className='w-full p-3 border border-gray-200 rounded-lg'
                                placeholder='Please enter a username'
                                value={editForm.username}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        username: e.target.value
                                    })
                                }
                            />

                        </div>


                        {/* =====================================================
                            BIO
                        ===================================================== */}

                        <div>

                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Bio
                            </label>

                            <textarea
                                rows={3}
                                className='w-full p-3 border border-gray-200 rounded-lg'
                                placeholder='Please enter a short bio'
                                value={editForm.bio}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        bio: e.target.value
                                    })
                                }
                            />

                        </div>


                        {/* =====================================================
                            LOCATION
                        ===================================================== */}

                        <div>

                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Location
                            </label>

                            <input
                                type='text'
                                className='w-full p-3 border border-gray-200 rounded-lg'
                                placeholder='Please enter your location'
                                value={editForm.location}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        location: e.target.value
                                    })
                                }
                            />

                        </div>


                        {/* =====================================================
                            BUTTONS
                        ===================================================== */}

                        <div className='flex justify-end space-x-3 pt-6'>

                            <button
                                onClick={() => setShowEdit(false)}
                                type='button'
                                disabled={isSaving}
                                className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50'
                            >
                                Cancel
                            </button>

                            <button
                                type='submit'
                                disabled={isSaving}
                                className='px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </div>
    )
}

export default ProfileModal