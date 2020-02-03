import React from 'react'
import Nav from '../components/nav'

const Browser = ({ userAgent }) => (
  <div>
    <h1>Browser</h1>
    <Nav />
    <p>{userAgent}</p>
  </div>
)

Browser.getInitialProps = ({ req }) => {
  const userAgent = req ? req.headers['user-agent'] : navigator.userAgent
  return { userAgent }
}

export default Browser
