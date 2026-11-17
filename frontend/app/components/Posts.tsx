import Link from 'next/link'

import {sanityFetch} from '@/sanity/lib/live'
import {morePostsQuery, allPostsQuery} from '@/sanity/lib/queries'
import {AllPostsQueryResult} from '@/sanity.types'
import DateComponent from '@/app/components/Date'
import OnBoarding from '@/app/components/Onboarding'
import Avatar from '@/app/components/Avatar'
import {dataAttr} from '@/sanity/lib/utils'

const Post = ({post}: {post: AllPostsQueryResult[number]}) => {
  const {_id, title, slug, excerpt, date, author} = post

  return (
    <article
      data-sanity={dataAttr({id: _id, type: 'post', path: 'title'}).toString()}
      key={_id}
      className="border border-neutral-800 rounded-2xl p-6 bg-neutral-900/90 text-white flex flex-col justify-between transition-colors hover:border-neutral-600 relative shadow-sm"
    >
      <Link className="hover:underline transition-colors" href={`/posts/${slug}`}>
        <span className="absolute inset-0 z-10" />
      </Link>
      <div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>

        <p className="line-clamp-3 text-sm leading-6 text-neutral-400 max-w-[70ch]">{excerpt}</p>
      </div>
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-800">
        {author && author.firstName && author.lastName && (
          <div className="flex items-center">
            <Avatar person={author} small={true} />
          </div>
        )}
        <time className="text-neutral-400 text-xs font-mono" dateTime={date}>
          <DateComponent dateString={date} />
        </time>
      </div>
    </article>
  )
}

const Posts = ({
  children,
  heading,
  subHeading,
}: {
  children: React.ReactNode
  heading?: string
  subHeading?: string
}) => (
  <div>
    {heading && <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{heading}</h2>}
    {subHeading && <p className="mt-2 text-sm text-neutral-400">{subHeading}</p>}
    <div className="pt-6 space-y-4">{children}</div>
  </div>
)

export const MorePosts = async ({skip, limit}: {skip: string; limit: number}) => {
  try {
    const {data} = await sanityFetch({
      query: morePostsQuery,
      params: {skip, limit},
    })

    if (!data || data.length === 0) {
      return null
    }

    return (
      <Posts heading={`Recent Posts (${data?.length})`}>
        {data?.map((post: any) => <Post key={post._id} post={post} />)}
      </Posts>
    )
  } catch {
    return null
  }
}

export const AllPosts = async () => {
  try {
    const {data} = await sanityFetch({query: allPostsQuery})

    if (!data || data.length === 0) {
      return null
    }

    return (
      <Posts
        heading="Announcements & Latest Updates"
        subHeading="Official notifications and exam updates"
      >
        {data.map((post: any) => (
          <Post key={post._id} post={post} />
        ))}
      </Posts>
    )
  } catch {
    return null
  }
}
