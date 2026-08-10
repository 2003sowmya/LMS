import { useState } from "react";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

import "../../App.css";

/**
 * Stand-in for placement screens that are not built yet.
 *
 * One component reused for every pending page rather than ten near-identical
 * stub files -- ten stubs would all need deleting later, and it is easy to
 * miss one and ship an empty screen.
 */
export default function PlacementPlaceholder({ title, phase, items = [] }) {

  const [open, setOpen] = useState(false);

  return (
    <div className="app">

      <Navbar setOpen={setOpen} />

      <div className="layout">

        <Sidebar open={open} setOpen={setOpen} />

        <div className="main">

          <div className="content">

            <div className="header-box">
              <h2>{title}</h2>
              <p>
                {phase
                  ? `Not built yet — scheduled for ${phase}.`
                  : "Not built yet."}
              </p>
            </div>

            {items.length > 0 && (
              <div className="card">
                <h3>What this screen will do</h3>
                <ul>
                  {items.map((item) => (
                    <li key={item} style={{ marginBottom: "6px" }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}