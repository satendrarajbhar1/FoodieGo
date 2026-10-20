import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoMdArrowRoundBack } from "react-icons/io"
import { useDispatch, useSelector } from 'react-redux'
import { FaUtensils } from 'react-icons/fa6'
import { FiMapPin } from 'react-icons/fi'
import axios from 'axios'
import { serverUrl } from '../App'
import { setMyShopData } from '../redux/ownerSlice'

// Shop ke saved GeoJSON ([lng, lat]) ko { lat, lng } me badlo
const shopCoords = (shop) => {
    const c = shop?.location?.coordinates
    return c?.length === 2 ? { lat: c[1], lng: c[0] } : null
}

const CreateEditShop = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const { myShopData } = useSelector(state => state.owner)
    const { currentAddress, currentCity, currentState, currentLocation } =
        useSelector(state => state.user)

    const [name, setName] = useState(myShopData?.name || "")
    const [address, setAddress] = useState(
        myShopData?.address || currentAddress || ""
    )
    const [city, setCity] = useState(myShopData?.city || currentCity || "")
    const [state, setState] = useState(myShopData?.state || currentState || "")
    const [coords, setCoords] = useState(shopCoords(myShopData))
    const [finding, setFinding] = useState(false)

    const [frontendImage, setFrontendImage] = useState(myShopData?.image || null)
    const [backendImage, setBackendImage] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!myShopData) return
        setName(myShopData.name || "")
        setAddress(myShopData.address || currentAddress || "")
        setCity(myShopData.city || currentCity || "")
        setState(myShopData.state || currentState || "")
        setFrontendImage(myShopData.image || null)
        setCoords(shopCoords(myShopData))
    }, [myShopData])

    const handleImage = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setBackendImage(file)
        setFrontendImage(URL.createObjectURL(file))
    }

    // Address likhe text se coordinates dhundho (Geoapify)
    const geocodeAddress = async () => {
        try {
            const text = [address, city, state, "India"]
                .filter(Boolean)
                .join(", ")

            const result = await axios.get(
                "https://api.geoapify.com/v1/geocode/search",
                {
                    params: {
                        text,
                        format: "json",
                        limit: 1,
                        apiKey: import.meta.env.VITE_GEOAPIKEY,
                    },
                }
            )

            const place = result.data?.results?.[0]

            return place ? { lat: place.lat, lng: place.lon } : null
        } catch (error) {
            console.log("Geocode error:", error)
            return null
        }
    }

    const handleUseCurrentLocation = () => {
        if (!currentLocation) {
            alert("Browser ki location permission allow karo, phir dobara try karo.")
            return
        }

        setCoords(currentLocation)
    }

    const handleFindFromAddress = async () => {
        setFinding(true)
        const found = await geocodeAddress()
        setFinding(false)

        if (found) {
            setCoords(found)
        } else {
            alert("Is address se location nahi mili. 'Use my current location' try karo.")
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (loading) return

        setLoading(true)

        try {
            let finalCoords = coords

            // Owner ne kuch select nahi kiya: address se dhundho
            if (!finalCoords) {
                finalCoords = await geocodeAddress()
            }

            if (!finalCoords) {
                alert("Shop ki location set karo (current location ya address se).")
                return
            }

            const formData = new FormData()
            formData.append("name", name)
            formData.append("city", city)
            formData.append("state", state)
            formData.append("address", address)
            formData.append("lat", finalCoords.lat)
            formData.append("lng", finalCoords.lng)

            if (backendImage) {
                formData.append("image", backendImage)
            }

            const result = await axios.post(
                `${serverUrl}/api/shop/create-edit`,
                formData,
                { withCredentials: true }
            )

            dispatch(setMyShopData(result.data.shop))
            navigate("/")
        } catch (error) {
            console.log("STATUS:", error.response?.status)
            console.log("BACKEND ERROR:", error.response?.data)
            alert(error.response?.data?.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="box-border min-h-screen w-full overflow-x-hidden bg-gray-50 p-4 sm:p-5">

            <div
                onClick={() => navigate("/")}
                className="mb-3 flex w-fit cursor-pointer items-center gap-2 text-gray-700 transition hover:text-red-500"
            >
                <IoMdArrowRoundBack size={23} />
                <span className="font-medium">Back</span>
            </div>

            <div className="mx-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-md sm:p-6">

                <div className="mb-5 flex flex-col items-center justify-center text-center">
                    <div className="mb-3 rounded-xl bg-red-100 p-3 text-red-500">
                        <FaUtensils size={27} />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-800">
                        {myShopData?.name ? "Edit Shop" : "Add Shop"}
                    </h1>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Name
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter shop name"
                            required
                            className="box-border w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Shop Image
                        </label>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImage}
                            className="box-border w-full rounded-lg border border-gray-300 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-red-50 file:px-3 file:py-2 file:text-red-600"
                        />

                        {frontendImage && (
                            <div className="mt-3">
                                <img
                                    src={frontendImage}
                                    alt="Shop preview"
                                    className="h-36 w-full rounded-lg object-cover"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                City
                            </label>

                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Enter city"
                                required
                                className="box-border w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                State
                            </label>

                            <input
                                type="text"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                placeholder="Enter state"
                                required
                                className="box-border w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Address
                        </label>

                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Enter shop address"
                            required
                            className="box-border w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200"
                        />
                    </div>

                    {/* Shop location */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                            <FiMapPin className="text-red-500" />
                            Shop Location
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                            {coords
                                ? `Saved: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                                : "Abhi set nahi hai. Delivery partners aur nearby customers isi se match hote hain."}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={handleUseCurrentLocation}
                                className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                            >
                                Use my current location
                            </button>

                            <button
                                type="button"
                                onClick={handleFindFromAddress}
                                disabled={finding}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
                            >
                                {finding ? "Finding..." : "Find from address"}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-red-500 py-2.5 font-semibold text-white transition hover:bg-red-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default CreateEditShop