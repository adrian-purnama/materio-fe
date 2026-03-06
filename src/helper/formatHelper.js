import { baseURL } from "./apiHelper"

const formatImageUrl = (url) => {
  return `${baseURL}${url}`
}

export default formatImageUrl
