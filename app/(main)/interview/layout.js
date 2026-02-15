import {  PacmanLoader } from "react-spinners";
import { Suspense } from "react";


const layout = ({children}) => {
  return (
    <div className="px-5">
    
      <Suspense
        fallback={<PacmanLoader className="mt-4 m-auto" width={"100%"} color="#03faed" />}
      >
        {children}
      </Suspense>
    </div>
  )
}

export default layout
