import { Socket } from "socket.io"

const customRoutes = (socket: Socket) => {
    socket.on("manual-room-switch", data => {
        // Should contain logic for validating the input, causes this method allows anyone to join any room which is a security hazard, but for demo-purpose it is okay.
        if (data?.enter) {
            socket.join(data.enter)
        }
        if (data?.leave) {
            socket.leave(data.leave)
        }
        console.log(socket.rooms)
    })
}

export default customRoutes
