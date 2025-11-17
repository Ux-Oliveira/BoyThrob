import React from 'react'
import Nav from './components/Nav'
import Banner from './components/Banner'
import Mission from './components/Mission'
import Boys from './components/Boys'


export default function App(){
return (
<div className="appRoot">
<Nav />
<main>
<Banner />
<Mission />
<Boys />
</main>
</div>
)
}