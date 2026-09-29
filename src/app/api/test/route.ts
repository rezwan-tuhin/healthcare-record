import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const {searchParams} = new URL(request.url);
    const id = searchParams.get("id");
    return NextResponse.json({
        requestedId: id
    });
}


const products = [];

export async function POST(request: Request) {
    const body = await request.json();

    products.push(body);

    return NextResponse.json({
        success: true, 
        data: body
    });

}



///////////////


// await fetch("/api/test", {
//     method: "POST",
//     headers: {
//         "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//         id:1,
//         name: "Laptop",
//         price: 1000
//     });
// })


//URL Query parameter
//localhost:3000/api/test?id=2