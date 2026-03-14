import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import apiHelper from '../../helper/apiHelper'
import { baseURL } from '../../helper/apiHelper'
import SearchableDropdown from '../SearchableDropdown'
import AuthImage from '../AuthImage'
import FormattedNumberInput from '../FormattedNumberInput'

const emptyBomLine = { item: '', quantity: 0 }

const ProductForm = ({
  initialValues,
  preferredUnitOptions = [],
  items = [],
  onSubmit,
  onCancel,
  isEdit,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [unitSet, setUnitSet] = useState('')
  const [price, setPrice] = useState(0)
  const [billsOfMaterial, setBillsOfMaterial] = useState([emptyBomLine])
  const [imagePath, setImagePath] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const unitSetOptions = preferredUnitOptions.map((p) => ({
    unitSetId: p.unitSetId,
    label: `${p.unitSetDescription || 'Unit'} (${p.symbol || ''})`.trim() || p.unitSetId,
  }))

  const itemOptions = items.map((i) => {
    const suffix = i.unitSet?.symbol ?? i.unitSet?.description ?? ''
    const label = suffix ? `${i.name} (${suffix})` : i.name
    return { _id: i._id, name: label }
  })

  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name ?? '')
      setDescription(initialValues.description ?? '')
      setUnitSet(initialValues.unitSet?._id ?? initialValues.unitSet ?? '')
      setPrice(initialValues.price ?? 0)
      setImagePath(initialValues.imagePath ?? '')
      const bom = initialValues.billsOfMaterial?.length
        ? initialValues.billsOfMaterial.map((line) => ({
            item: line.item?._id ?? line.item ?? '',
            quantity: line.quantity ?? 0,
          }))
        : [emptyBomLine]
      setBillsOfMaterial(bom)
    } else {
      setName('')
      setDescription('')
      setUnitSet('')
      setPrice(0)
      setImagePath('')
      setBillsOfMaterial([emptyBomLine])
    }
  }, [initialValues, preferredUnitOptions])

  const productImageSrc = imagePath
    ? (imagePath.startsWith('http') ? imagePath : `${baseURL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`)
    : ''

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await apiHelper.post('/api/images/upload', formData)
      if (data?.success && data?.data?.urlPath) {
        setImagePath(data.data.urlPath)
        toast.success('Image uploaded')
      } else {
        toast.error('Upload failed')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Upload failed'
      toast.error(msg)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleBomChange = (index, field, value) => {
    setBillsOfMaterial((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    )
  }

  const handleAddBomLine = () => {
    setBillsOfMaterial((prev) => [...prev, { ...emptyBomLine }])
  }

  const handleRemoveBomLine = (index) => {
    setBillsOfMaterial((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!unitSet || !unitSet.trim()) {
      toast.error('Please select a unit set')
      return
    }
    const bomLinesWithItem = billsOfMaterial.filter((line) => line.item && line.item.trim())
    const invalidBom = bomLinesWithItem.some((line) => Number(line.quantity) <= 0)
    if (invalidBom) {
      toast.error('Each ingredient must have a quantity greater than 0')
      return
    }
    const bom = bomLinesWithItem
      .filter((line) => Number(line.quantity) > 0)
      .map((line) => ({ item: line.item, quantity: Number(line.quantity) }))
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      unitSet: unitSet || undefined,
      price: Number(price) >= 0 ? Number(price) : 0,
      billsOfMaterial: bom,
      imagePath: imagePath.trim() || undefined,
    })
  }

  const canSubmit = !!(unitSet && unitSet.trim()) && !billsOfMaterial.some((line) => line.item && line.item.trim() && Number(line.quantity) <= 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="e.g. Cookie"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          rows={2}
          placeholder="Short description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
        <div className="flex flex-col gap-2">
          {productImageSrc ? (
            <div className="flex items-center gap-3">
              <AuthImage
                src={productImageSrc}
                alt="Product"
                className="h-20 w-auto object-contain rounded border border-gray-300 bg-gray-50"
              />
              <button
                type="button"
                onClick={() => setImagePath('')}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Remove image
              </button>
            </div>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={handleImageUpload}
            disabled={uploading}
            className="w-full text-sm text-gray-600 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:bg-amber-500 file:text-gray-900 file:font-medium file:cursor-pointer hover:file:bg-amber-400"
          />
          {uploading && <span className="text-xs text-gray-500">Uploading…</span>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit set</label>
          <SearchableDropdown
            options={unitSetOptions}
            valueKey="unitSetId"
            labelKey="label"
            value={unitSet}
            onChange={(id) => setUnitSet(id)}
            placeholder="Select unit set"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <FormattedNumberInput
            value={price}
            onChange={setPrice}
            min={0}
            className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Bill of materials</label>
          <button
            type="button"
            onClick={handleAddBomLine}
            className="text-sm font-medium text-amber-600 hover:text-amber-700"
          >
            + Add ingredient
          </button>
        </div>
        <div className="space-y-2">
          {billsOfMaterial.map((line, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              <select
                value={line.item}
                onChange={(e) => handleBomChange(index, 'item', e.target.value)}
                className="flex-1 min-w-[120px] bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select item</option>
                {itemOptions.map((opt) => (
                  <option key={opt._id} value={opt._id}>
                    {opt.name}
                  </option>
                ))}
              </select>
              <FormattedNumberInput
                value={line.quantity}
                onChange={(n) => handleBomChange(index, 'quantity', n)}
                min={0}
                placeholder="Qty"
                className="w-24 bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => handleRemoveBomLine(index)}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {items.length === 0 && (
          <p className="text-xs text-amber-600">Add items in the Items tab first to use them here.</p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-4 py-2 rounded bg-amber-500 text-gray-900 hover:bg-amber-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEdit ? 'Update' : 'Save'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default ProductForm
