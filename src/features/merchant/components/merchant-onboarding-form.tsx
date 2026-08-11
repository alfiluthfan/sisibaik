import {
  createMerchantProfileAction,
} from "@/features/merchant/actions";


export function MerchantOnboardingForm() {

  return (

    <form
      action={
        createMerchantProfileAction
      }
      className="space-y-6"
    >

      {/* BUSINESS NAME */}

      <div className="space-y-2">

        <label
          htmlFor="businessName"
          className="text-sm font-medium"
        >
          Nama Usaha
        </label>

        <input
          id="businessName"
          name="businessName"
          type="text"
          required
          placeholder="Contoh: Bakery SisiBaik"
          className="w-full rounded-lg border px-4 py-3"
        />

      </div>


      {/* DESCRIPTION */}

      <div className="space-y-2">

        <label
          htmlFor="description"
          className="text-sm font-medium"
        >
          Deskripsi Usaha
        </label>

        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Ceritakan sedikit tentang usaha Anda..."
          className="w-full rounded-lg border px-4 py-3"
        />

      </div>


      {/* PHONE */}

      <div className="space-y-2">

        <label
          htmlFor="phone"
          className="text-sm font-medium"
        >
          Nomor Telepon
        </label>

        <input
          id="phone"
          name="phone"
          type="tel"
          required
          placeholder="08123456789"
          className="w-full rounded-lg border px-4 py-3"
        />

      </div>


      {/* ADDRESS */}

      <div className="space-y-2">

        <label
          htmlFor="address"
          className="text-sm font-medium"
        >
          Alamat Usaha
        </label>

        <textarea
          id="address"
          name="address"
          rows={3}
          required
          placeholder="Masukkan alamat lengkap usaha..."
          className="w-full rounded-lg border px-4 py-3"
        />

      </div>


      {/* LOCATION */}

      <div className="grid gap-4 md:grid-cols-2">

        <div className="space-y-2">

          <label
            htmlFor="latitude"
            className="text-sm font-medium"
          >
            Latitude
          </label>

          <input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            placeholder="-6.200000"
            className="w-full rounded-lg border px-4 py-3"
          />

        </div>


        <div className="space-y-2">

          <label
            htmlFor="longitude"
            className="text-sm font-medium"
          >
            Longitude
          </label>

          <input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            placeholder="106.816666"
            className="w-full rounded-lg border px-4 py-3"
          />

        </div>

      </div>


      <p className="text-xs text-gray-500">
        Lokasi akan digunakan untuk membantu
        pengguna menemukan makanan surplus
        di sekitar mereka.
      </p>


      <button
        type="submit"
        className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white"
      >
        Kirim Data Usaha
      </button>

    </form>

  );
}