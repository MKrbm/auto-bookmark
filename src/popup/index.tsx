// import '../global.css';
// import React from 'react';
// import { createRoot } from 'react-dom/client';
// import { Provider } from 'react-redux';
// import { proxyStore } from '../app/proxyStore';
// import Popup from './Popup';

// proxyStore.ready().then(() => {
//   createRoot(document.getElementById('root') as HTMLElement).render(
//     <React.StrictMode>
//       <Provider store={proxyStore}>
//         <Popup />
//       </Provider>
//     </React.StrictMode>
//   );
// });

import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import { Popup } from "./Popup";
import Popup from "./Popup";
import '../app/features/styles/highlight.css';
import '../global.css';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="bg-green-500 w-[400px] h-[500px] p-5">
      <Popup />
    </div>
  </StrictMode>
);
