

/*

Features: 

- add sections with pencil.

- select sections with cursor.

- equivalent selection operation to PianoRoll class.

- select sections with marquee tool.

- shift sections up or down if permissible. In this context that means transferring a section from one channel
to another. 

- shift selections back to the previous bar or forwards to the next bar if permissible. 

- copy / cut / paste / delete operations on one or more sections.

- double click sectons to open a PianoRoll window for that section. 

- mousedown on a section when cursor tool is active to begin dragging it to a new position (which will affect
the start time for the audio engines Section instance and the channel that it is assigned to).

- mousedown on the edge of a section to resize it, which means altering the number of bars that the audio
engines Section instance lasts for.  

*/


export default class SectionLayer {

}
