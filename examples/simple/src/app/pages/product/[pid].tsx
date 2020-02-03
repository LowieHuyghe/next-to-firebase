import React from 'react'
import { useRouter } from 'next/router'
import Nav from '../../components/nav'

/**
 * Static page with dynamic routing
 */
const Product = () => {
  const router = useRouter()
  const { pid } = router.query

  return (
    <div>
      <h1>Product {pid}</h1>
      <Nav />
    </div>
  )
}

export default Product
