import {
  Calendar,
  MapPin,
  PenBox,
  Verified,
  Mail,
  Megaphone,
  Sparkles
} from 'lucide-react'

import moment from 'moment'
import React from 'react'

const UserProfileInfo = ({
  user,
  posts,
  profileId,
  setShowEdit
}) => {

  // =====================================================
  // VERIFIED STATUS
  // =====================================================

  const isVerified =
    user?.isVerified === true


  // =====================================================
  // PROFILE NAME
  // =====================================================

  const fullName =
    user?.full_name ||
    user?.name ||
    user?.username ||
    'User'


  // =====================================================
  // PROFILE PICTURE
  // =====================================================

  const profilePicture =
    typeof user?.profile_picture === 'string' &&
    user.profile_picture.trim() !== ''
      ? user.profile_picture.trim()
      : null


  // =====================================================
  // PROFILE INITIAL
  // =====================================================

  const profileInitial =
    fullName
      .charAt(0)
      .toUpperCase()


  return (
    <div className='relative py-4 px-6 md:px-8 bg-white'>

      <div className='flex flex-col md:flex-row items-start gap-6'>

        {/* PROFILE IMAGE */}

        <div className='w-32 h-32 border-4 border-white shadow-lg absolute -top-16 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center'>

          {profilePicture ? (

            <img
              src={profilePicture}
              alt={fullName}
              className='w-full h-full object-cover rounded-full'
            />

          ) : (

            <span className='text-4xl font-bold text-indigo-600'>
              {profileInitial}
            </span>

          )}

        </div>


        {/* PROFILE INFORMATION */}

        <div className='w-full pt-16 md:pt-0 md:pl-36'>


          {/* NAME + EDIT BUTTON */}

          <div className='flex flex-col md:flex-row items-start justify-between'>


            {/* NAME SECTION */}

            <div>

              <div className='flex items-center gap-3'>

                <h1 className='text-2xl font-bold text-gray-900'>
                  {fullName}
                </h1>


                {/* VERIFIED BADGE */}

                {isVerified && (

                  <Verified
                    className='w-6 h-6 text-blue-500'
                  />

                )}

              </div>


              {/* USERNAME */}

              <p className='text-gray-600'>

                {user?.username
                  ? `@${user.username}`
                  : 'Add a username'}

              </p>

            </div>


            {/* EDIT BUTTON */}

            {!profileId && (

              <button
                type='button'
                onClick={() =>
                  setShowEdit(true)
                }
                className='flex items-center gap-2 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors mt-4 md:mt-0 cursor-pointer'
              >

                <PenBox className='w-4 h-4' />

                Edit

              </button>

            )}

          </div>


          {/* BIO */}

          {user?.bio && (

            <p className='text-gray-700 text-sm max-w-md mt-4'>
              {user.bio}
            </p>

          )}


          {/* LOCATION + JOINED DATE */}

          <div className='flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 mt-4'>


            {/* LOCATION */}

            <span className='flex items-center gap-1.5'>

              <MapPin className='w-4 h-4' />

              {user?.location
                ? user.location
                : 'Add location'}

            </span>


            {/* JOINED */}

            <span className='flex items-center gap-1.5'>

              <Calendar className='w-4 h-4' />

              Joined

              <span className='font-medium'>

                {user?.createdAt
                  ? moment(user.createdAt).fromNow()
                  : 'Recently'}

              </span>

            </span>

          </div>


          {/* PROFILE STATS */}

          <div className='flex items-center gap-6 mt-6 border-t border-gray-200 pt-4'>


            {/* POSTS */}

            <div>

              <span className='sm:text-xl font-bold text-gray-900'>

                {Array.isArray(posts)
                  ? posts.length
                  : 0}

              </span>

              <span className='text-xs sm:text-sm text-gray-500 ml-1.5'>
                Posts
              </span>

            </div>


            {/* FOLLOWERS */}

            <div>

              <span className='sm:text-xl font-bold text-gray-900'>

                {Array.isArray(user?.followers)
                  ? user.followers.length
                  : 0}

              </span>

              <span className='text-xs sm:text-sm text-gray-500 ml-1.5'>
                Followers
              </span>

            </div>


            {/* FOLLOWING */}

            <div>

              <span className='sm:text-xl font-bold text-gray-900'>

                {Array.isArray(user?.following)
                  ? user.following.length
                  : 0}

              </span>

              <span className='text-xs sm:text-sm text-gray-500 ml-1.5'>
                Following
              </span>

            </div>

          </div>


          {/* SPONSORED EMAIL MARKETING */}

          {isVerified && (

            <div className='mt-6 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-purple-50 p-5 shadow-sm'>

              <div className='flex items-start gap-4'>


                {/* AD ICON */}

                <div className='w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0'>

                  <Megaphone className='w-6 h-6 text-blue-600' />

                </div>


                {/* AD CONTENT */}

                <div className='flex-1'>


                  {/* TITLE */}

                  <div className='flex items-center gap-2 flex-wrap'>

                    <h3 className='text-lg font-bold text-gray-900'>
                      Sponsored Email Marketing
                    </h3>


                    {/* VERIFIED LABEL */}

                    <span className='flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold'>

                      <Verified className='w-3.5 h-3.5' />

                      Verified

                    </span>

                  </div>


                  {/* DESCRIPTION */}

                  <p className='text-sm text-gray-600 mt-1'>

                    Promote your brand, products, or services
                    through targeted email marketing campaigns
                    on PingUp.

                  </p>


                  {/* BUTTONS */}

                  <div className='flex flex-wrap gap-3 mt-4'>


                    {/* CREATE CAMPAIGN */}

                    <button
                      type='button'
                      onClick={() => {
                        alert(
                          'Sponsored Email Marketing campaign coming soon!'
                        )
                      }}
                      className='flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors cursor-pointer'
                    >

                      <Mail className='w-4 h-4' />

                      Create Campaign

                    </button>


                    {/* LEARN MORE */}

                    <button
                      type='button'
                      onClick={() => {
                        alert(
                          'Sponsored Email Marketing helps verified users promote their content.'
                        )
                      }}
                      className='flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors cursor-pointer'
                    >

                      <Sparkles className='w-4 h-4' />

                      Learn More

                    </button>

                  </div>

                </div>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>
  )
}

export default UserProfileInfo