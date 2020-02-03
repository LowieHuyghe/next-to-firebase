import React from 'react'
import Link from 'next/link'

const Nav = () => (
  <ul>
    <li>
      <Link href='/'>
        <a>Home</a>
      </Link>
    </li>
    <li>
      <Link href='/browser'>
        <a>Browser</a>
      </Link>
    </li>
    <li>
      <Link href='/product/[pid]' as='/product/123'>
        <a>Product 123</a>
      </Link>
    </li>
    <li>
      <Link href='/product/[pid]' as='/product/456'>
        <a>Product 456</a>
      </Link>
    </li>
  </ul>
)

export default Nav
